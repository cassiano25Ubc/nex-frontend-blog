# PRD: Usuário e post premium

## 1. Resumo

Introduzir o conceito de **premium** em dois níveis: usuários podem ser premium (após pagamento via Stripe) e posts podem ser marcados como premium. Posts premium só são visíveis para usuários premium logados, e só usuários premium podem criar posts premium.

## 2. Objetivos

- Permitir monetização via pagamento único (Stripe Checkout).
- Restringir a leitura e a criação de conteúdo premium a usuários premium.
- Manter a experiência atual para usuários não premium e visitantes.

### Fora de escopo

- Assinatura recorrente, expiração ou renovação do premium.
- Alterar um post existente entre público e premium.
- Tratamento de reembolsos/disputas (o status premium não é revogado automaticamente nesta versão).
- Ação de negócio além de marcar o usuário como premium no webhook.

## 3. Regras de negócio

| # | Regra |
|---|-------|
| R1 | Um usuário tem a flag `premium` (padrão: `false`). |
| R2 | Um post tem a flag `premium` (padrão: `false`), definida **apenas na criação** e imutável depois. |
| R3 | Premium é **permanente** (pagamento único). |
| R4 | Somente usuário premium pode criar post premium. |
| R5 | Usuário premium logado vê posts públicos **e** premium (dele e de outros). |
| R6 | Visitante, usuário deslogado ou não premium **não** vê posts premium. |
| R7 | Se o autor deixar de ser premium, seus posts premium ficam ocultos para todos até ele voltar a ser premium. |

## 4. Fluxo de pagamento

1. Usuário logado chama `POST /api/me/checkout` e recebe o link do Stripe.
2. Após o pagamento, o Stripe envia `checkout.session.completed` para `POST /api/webhook/stripe`.
3. O webhook valida a assinatura (`STRIPE_WEBHOOK_SECRET`) e lê o `client_reference_id` (id do usuário que iniciou o checkout).
4. O backend marca esse usuário como premium.

### Edge cases do pagamento

- **Webhook duplicado/reenviado:** marcar como premium deve ser idempotente.
- **`client_reference_id` ausente ou usuário inexistente:** não marcar ninguém; registrar o erro e responder 400.
- **Assinatura inválida:** responder 400 sem processar.
- **Checkout concluído, mas webhook ainda não processado:** o usuário pode continuar não premium por alguns instantes; a UI não deve assumir premium só pelo retorno da página de sucesso.
- **Usuário já premium inicia outro checkout:** deve ser bloqueado ou ignorado para evitar cobrança duplicada.
- **Checkout não concluído (cancelado/expirado):** nenhum efeito.

## 5. Comportamento esperado

### Listagem de posts

- Visitante ou usuário não premium: apenas posts públicos.
- Usuário premium logado: posts públicos + premium.
- Posts premium de autor que deixou de ser premium não aparecem para ninguém (R7).
- Paginação e contagem total devem refletir o mesmo filtro aplicado à listagem.

### Post individual (`GET /posts/:id`)

- Post premium acessado por quem não pode vê-lo: responder **404**, como se não existisse.
- Likes e respostas em post premium seguem a mesma regra de visibilidade: quem não vê o post não pode interagir (404).

### Criação de post

- Usuário premium pode marcar o post como premium.
- Usuário não premium que enviar `premium: true`: rejeitar com **403**.
- A UI só exibe a opção "post premium" para usuários premium.

### Edição de post

- A flag `premium` não pode ser alterada. Tentativas de alterá-la são ignoradas ou rejeitadas com 400 (definir na implementação e documentar no OpenAPI).

## 6. Impactos técnicos

- **Backend:** campos `premium` em usuário e post; filtro de visibilidade na listagem e no detalhe; validação na criação; ação no webhook.
- **Frontend:** campo/checkbox premium no formulário de criação (visível só para premium); indicador visual de post premium; botão para assinar/virar premium para usuários não premium.
- **Contrato:** atualizar [docs/openapi.yaml](../../openapi.yaml) e [lib/api.ts](../../../src/app/lib/api.ts) (campo `premium` em usuário e post; erro 403 na criação).
- **Sessão:** o status premium do usuário deve ser obtido do backend (não confiar em estado do cliente).

## 7. Critérios de aceite

- [ ] Usuário comum não vê posts premium na listagem nem no detalhe (404).
- [ ] Usuário premium vê posts públicos e premium.
- [ ] Usuário comum recebe 403 ao tentar criar post premium.
- [ ] Webhook válido com `client_reference_id` torna o usuário premium; reenvio não causa erro.
- [ ] Webhook com assinatura inválida ou sem `client_reference_id` retorna 400.
- [ ] Posts premium de um autor sem premium ficam ocultos para todos.
- [ ] A flag `premium` de um post não muda após a criação.
