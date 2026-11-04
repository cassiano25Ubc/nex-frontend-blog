# Feature: Usuário e post premium 

## Descrição da funcionalidade 
Essa feature vai basicamente ter 2 funções :
-Um usuário pode ser marcado como PREMIUM.
-Um post pode ser marcado como PREMIUM.

na Listagem  de posts públicas, quando o usuário estivér logado (authorization) e for um usuário premium eu defvo incluir na listagem também  os posts marcados como premium.

apenas um usuário marcado  como premium deve poder criar posts premium.

## Aspectos de integração a pagamento
Nós temos  um endpoint POST /api/me/checkout que gera um link Stripe e um Webhook em POST /api/webhook/stripe que recebe o checkout.session.completed com o client_reference_id com o id do usuário logado.

A partir desse recebimento você  vai marcar o usuário como premium, dando acesso de visualização  ao post premium  (dele e  de outros  ) e também a possibilidade de criar  posts marcados como premium.