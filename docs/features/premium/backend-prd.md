# PRD (Backend): Usuário e post premium

Complementa o [PRD da feature](./prd.md). O contrato HTTP está em [docs/openapi.yaml](../../openapi.yaml), que é a fonte de verdade.

## 1. Escopo

Entregar no backend o que o frontend já assume: flag premium em usuário e post, filtro de visibilidade, validação na criação, checkout e ativação do premium por um endpoint interno acionado pelo webhook do Stripe (que fica no frontend).

Fora de escopo: assinatura recorrente, expiração, reembolso/disputa (não revogam o premium), edição da flag `premium` de um post.

## 2. Modelo de dados

| Tabela | Mudança |
|--------|---------|
| `users` | `premium boolean not null default false` |
| `posts` | `premium boolean not null default false` (imutável após a criação) |

- Migração com backfill `false` para registros existentes.
- `UserProfile` e `Post` (e derivados) passam a expor `premium`.

## 3. Regra de visibilidade

Um post é **visível** para o requisitante quando:

- `post.premium = false`; ou
- o requisitante está autenticado, é premium **e** o autor do post é premium.

Se o autor deixar de ser premium, seus posts premium ficam ocultos para todos até ele voltar a ser premium. A regra deve ficar em um único ponto reutilizável (filtro de query + checagem por id) para não divergir entre endpoints.

## 4. Endpoints

| Endpoint | Auth | Comportamento |
|----------|------|---------------|
| `GET /api/posts` | opcional | Aplica a regra de visibilidade. `total`/`totalPages` usam o mesmo filtro. Token inválido ou expirado: 401, como nos demais endpoints com auth opcional. |
| `GET /api/posts/{id}` | opcional | Post não visível: **404**. |
| `POST /api/posts` | obrigatória | `premium` opcional (padrão `false`). `premium: true` por não premium: **403**. |
| `PUT /api/posts/{id}` e `/image` | obrigatória | Sem mudança; `premium` segue rejeitado por `additionalProperties: false` (400). |
| `POST/DELETE /api/posts/{id}/likes` | obrigatória | Post não visível: **404**. |
| `POST /api/posts/{id}/replies` | obrigatória | Post não visível: **404**. Não enfileirar notificação nesse caso. |
| `POST /api/me/checkout` | obrigatória | Usuário já premium: **409**, sem criar sessão no Stripe. |
| `PUT /api/internal/users/{id}/premium` | `X-Internal-Token` | Uso interno do webhook do frontend. Ver seção 5. |

Em endpoints de interação, a checagem de visibilidade vem antes de qualquer efeito colateral. O 404 (e não 403) evita revelar a existência do post.

## 5. Ativação do premium (webhook no frontend)

O webhook do Stripe fica no **frontend** (`POST /api/webhook/stripe`). Ele valida a assinatura com `STRIPE_WEBHOOK_SECRET` e, em `checkout.session.completed`, chama o backend. O backend não recebe o Stripe diretamente.

Endpoint interno: `PUT /api/internal/users/{id}/premium`.

1. Exigir o header `X-Internal-Token` igual a `INTERNAL_API_TOKEN` (comparação em tempo constante). Ausente ou diferente: **401**, sem tocar no banco.
2. `id` inválido: **400**. Usuário inexistente: **404**.
3. Marcar `users.premium = true`. **Idempotente**: usuário já premium também responde **204**.
4. Responder 204 apenas depois de persistir.

Notas:
- O endpoint não aceita Bearer de usuário e não deve ser exposto publicamente (rede interna ou bloqueio no proxy), além da checagem do token.
- Não logar o token; registrar apenas o `id` do usuário e o resultado.
- O frontend responde ao Stripe 200 se o backend responder 204 e 400 em qualquer outra falha.
## 6. Checkout

- Já premium: 409 antes de chamar o Stripe.
- Sessão criada com `client_reference_id = user.id` e `customer_email = user.email`.
- O retorno para `STRIPE_SUCCESS_URL` não ativa o premium; só o webhook ativa. Há uma janela curta em que o usuário pagou e ainda não é premium.

## 7. Configuração

`STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`, `INTERNAL_API_TOKEN` (segredo compartilhado com o frontend; `STRIPE_WEBHOOK_SECRET` pertence ao frontend). Todos em `.env.example`. Falha de configuração ausente deve ser detectada na inicialização ou responder 500 sem vazar detalhes.

## 8. Critérios de aceite

- [ ] Migração adiciona `premium` em `users` e `posts`, com padrão `false`.
- [ ] `UserProfile` e `Post` retornam `premium`.
- [ ] Listagem e detalhe respeitam a regra de visibilidade; paginação consistente com o filtro.
- [ ] Likes e replies em post não visível retornam 404 sem efeito colateral.
- [ ] Não premium recebe 403 ao criar com `premium: true`; premium consegue.
- [ ] Posts premium de autor sem premium ficam ocultos para todos.
- [ ] Checkout de usuário já premium retorna 409.
- [ ] Endpoint interno: sem token ou token errado → 401; usuário inexistente → 404; válido → usuário premium (204); repetido → 204.
- [ ] Testes automatizados cobrem visibilidade, criação e ativação do premium (incluindo idempotência).

## 9. Questões em aberto

- Como o backend deve tratar token inválido em `GET /api/posts`: 401 ou tratar como anônimo? Este PRD assume 401, igual a `GET /api/posts/{id}`.
