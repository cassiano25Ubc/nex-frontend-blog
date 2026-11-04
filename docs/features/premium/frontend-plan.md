# Plano de implementação (Frontend): premium

Baseado no [PRD do backend](./backend-prd.md) e no [OpenAPI](../../openapi.yaml). Regras de visibilidade, 403/404/409 e ativação do premium são **responsabilidade do backend**; o frontend só consome o contrato e trata as respostas.

## Estado atual (branch `feat/premium-implementada`)

| Item | Status |
|------|--------|
| Tipos `premium` em `UserProfile`/`Post`, `createPost({premium})`, `createCheckout()` em [api.ts](../../../src/app/lib/api.ts) | Feito |
| `listPosts` com auth opcional | Feito |
| Botão "Virar premium" + selo no [Header](../../../src/app/components/Header.tsx) | Feito |
| Checkbox premium só para premium em [PostForm](../../../src/app/components/PostForm.tsx) / [posts/new](../../../src/app/posts/new/page.tsx) | Feito |
| Tratamento de 403 na criação e 409 no checkout | Feito |
| Selo nos posts (card e detalhe) | Feito |
| Detalhe de post: 404 → `notFound()` | Já funciona |
| Webhook em `src/app/api/webhook/stripe/route.ts` ativando o premium via endpoint interno do backend | Feito (etapa 1) |

## Etapas

### 1. Webhook no frontend com endpoint interno (decisão: opção B) — feito

O webhook fica em [route.ts](../../../src/app/api/webhook/stripe/route.ts). Ele valida a assinatura (`STRIPE_WEBHOOK_SECRET`), exige `client_reference_id` inteiro positivo e chama `activateUserPremium` em [api.ts](../../../src/app/lib/api.ts), que faz `PUT /api/internal/users/{id}/premium` com o header `X-Internal-Token` (`INTERNAL_API_TOKEN`). Respostas ao Stripe: 200 se o backend devolver 204 (ou evento ignorado); 400 em qualquer falha.

- Contrato: endpoint interno e esquema `InternalToken` no [OpenAPI](../../openapi.yaml); regras no [PRD do backend](./backend-prd.md#5-ativação-do-premium-webhook-no-frontend).
- `INTERNAL_API_TOKEN` precisa ser o mesmo valor nos dois serviços.
- O endpoint do backend não deve ficar exposto publicamente.
### 2. Sessão expirada na listagem

`listPosts` agora envia o token. Com token inválido o backend responde 401 e [page.tsx](../../../src/app/page.tsx) mostra o alerta genérico de erro.

- Em `PostList`, tratar `ApiError` 401 com `redirect("/session/expired")` (mesmo padrão do Header e do detalhe).

Critério de pronto: home com cookie inválido limpa a sessão e leva a `/login?session=expired`.

### 3. Retorno do checkout

O premium só vale após o webhook; o retorno do Stripe pode chegar antes (janela curta).

- Definir `STRIPE_SUCCESS_URL` com um marcador (ex.: `/?checkout=success`) e `STRIPE_CANCEL_URL` (ex.: `/?checkout=cancel`) no backend/`.env.example`.
- Na home, exibir aviso: sucesso ("Pagamento recebido. O acesso premium é liberado em instantes; recarregue a página.") e cancelamento ("Pagamento cancelado.").
- Não marcar o usuário como premium no cliente com base nesse parâmetro; a fonte é `getMe().premium`.

Critério de pronto: avisos corretos e nenhuma lógica de premium dependente da query string.

### 4. Erros 404 em interações com post premium inacessível

- Likes: [toggleLikeAction](../../../src/app/post-actions.ts) já redireciona para `/` em 404.
- Replies: [reply-actions.ts](../../../src/app/reply-actions.ts) já trata 404 com mensagem; conferir que o texto não sugere que o post "existe" (usar "Este post não foi encontrado.").

Critério de pronto: nenhum fluxo revela a existência de um post premium inacessível.

### 5. Edição de post

A flag `premium` é imutável e o `PUT` rejeita campos extras.

- Não enviar `premium` em `updatePost`.
- Na página de edição, mostrar o selo "Premium" somente leitura (sem checkbox).

Critério de pronto: editar um post premium mantém a flag e não envia o campo.

### 6. Testes (vitest)

- Webhook: sem assinatura/assinatura inválida → 400; `client_reference_id` ausente ou inválido → 400; backend 204 → 200; backend 404/erro → 400; evento de outro tipo → 200 sem chamar o backend.
- `activateUserPremium` envia `X-Internal-Token` e falha sem `INTERNAL_API_TOKEN`.
Em [api.test.ts](../../../src/app/lib/api.test.ts) e novos arquivos junto às actions:

- `createCheckout` exige sessão (já coberto) e retorna `url`.
- `listPosts` envia `Authorization` quando há cookie e funciona sem cookie.
- `withDefaults` assume `premium: false` quando o backend omite o campo.
- `createPostAction`: envia `premium: true` só com checkbox marcado; 403 → mensagem de permissão.
- `checkoutAction`: 409 → "Você já é premium."; sucesso redireciona para a URL do Stripe.

### 7. Documentação

- [AGENTS.md](../../../AGENTS.md): mencionar `createCheckout` e que `listPosts` usa auth opcional.
- `.env.example`: URLs de sucesso/cancelamento (`INTERNAL_API_TOKEN` já adicionado).

## Verificação final

- `npx tsc --noEmit` e `npm test` passam.
- Teste manual com backend real: usuário comum (sem posts premium, sem checkbox), checkout, retorno e liberação após o webhook, criação de post premium, usuário premium já existente (409).

## Ordem sugerida

1 → 2 → 5 → 4 → 6 → 3 → 7. A etapa 1 está concluída; 2, 4 e 5 são pequenas e independentes do backend; 3 depende das URLs do Stripe.
