# Plano de integração do frontend com a API

Este documento relaciona as telas e funcionalidades descritas em
[`braindump.md`](./braindump.md) aos endpoints definidos em
[`openapi.yaml`](./openapi.yaml).

**Base URL local:** `http://localhost:3000`, conforme o OpenAPI. Configure a
URL da API no frontend para que possa ser alterada entre ambientes.

## Mapa de telas e funcionalidades

| Tela / funcionalidade | Endpoint(s) | Uso no frontend |
|---|---|---|
| Cabeçalho — visitante | Nenhum | Exibir links para login e cadastro quando não houver sessão autenticada. |
| Cabeçalho — usuário autenticado | `GET /api/me` (restaurar sessão) | Consultar o perfil ao iniciar a aplicação se houver token salvo. Enviar o token no cabeçalho `Authorization` usando o esquema Bearer. Usar a sessão para exibir as ações de criar post e sair. |
| Sair | Nenhum endpoint de logout definido | Remover o token e os dados de sessão no cliente e atualizar o cabeçalho. |
| Página inicial — listar posts | `GET /api/posts?page={page}` | Carregar posts por página. A resposta inclui `data` e `meta`; cada item contém autor, imagem, quantidade de likes e replies. A página padrão é `1`; o limite é fixo em 10. |
| Post individual — carregar conteúdo | `GET /api/posts/{id}` | Buscar os dados do post, `likesCount`, `likedByMe` e `replies`. A consulta é pública; enviar o token quando houver sessão para receber o estado pessoal de like. |
| Post individual — dar like | `POST /api/posts/{id}/likes` | Exigir sessão e enviar o token. A operação não recebe body e retorna `204`; após sucesso, atualizar os dados do post, por exemplo refazendo a consulta de detalhe. |
| Post individual — remover like | `DELETE /api/posts/{id}/likes` | Exigir sessão e enviar o token. A operação não recebe body e retorna `204`; após sucesso, atualizar os dados do post. |
| Post individual — responder | `POST /api/posts/{id}/replies` | Exigir sessão e enviar `{ "content": "..." }`. Em sucesso, recebe a reply criada (`201`); atualizar a lista de replies. |
| Login | `POST /api/auth/login` | Enviar `{ "email": "...", "password": "..." }`. Em sucesso (`200`), armazenar o token em cookie `httpOnly` e carregar o perfil autenticado para atualizar o cabeçalho. |
| Cadastro | `POST /api/auth/register` | Enviar `{ "name": "...", "email": "...", "password": "..." }`. Em sucesso (`201`), armazenar o token em cookie `httpOnly`; a conta já fica autenticada. |
| Criar post — `/posts/new` | `POST /api/posts` | Exigir sessão validada e enviar `{ "title": "...", "content": "..." }`. O corpo é editado em textarea. Em sucesso (`201`), encaminhar para o post criado. |
| Editar post — `/posts/{id}/edit` | `GET /api/me`, `GET /api/posts/{id}`, `PUT /api/posts/{id}` | Exigir sessão e confirmar que o post pertence ao usuário antes de exibir ou salvar o formulário. O backend também valida a autoria na atualização; ao salvar, revalidar a página de edição para que navegações de retorno exibam os dados atuais. |
| Apagar post — página do post | `GET /api/me`, `GET /api/posts/{id}`, `DELETE /api/posts/{id}` | Exibir a ação apenas ao autor autenticado, pedir confirmação e validar novamente a autoria no servidor antes de apagar; revalidar as rotas do post, incluindo edição. |

## Sessão e autorização

- As operações autenticadas usam o cabeçalho `Authorization` com o esquema
  Bearer. O token retornado por login e cadastro é uma string hexadecimal de
  64 caracteres.
- Login e cadastro retornam `{ token, user }`; não é necessário chamar
  `GET /api/me` imediatamente após essas operações. Esse endpoint é útil para
  restaurar o perfil de uma sessão já armazenada.
- Se `GET /api/me` responder `401`, tratar a sessão como inválida, remover o
  cookie e exibir o cabeçalho de visitante.
- O detalhe do post aceita autenticação opcional: sem uma sessão válida,
  `likedByMe` é `false`. Likes e criação de replies exigem autenticação.
- Criar post exige sessão. Edição e exclusão exigem sessão e autoria; as telas e
  Server Actions verificam o proprietário, além das verificações do backend.
- A API não define endpoint de logout. A ação “sair” é local: limpar o cookie
  de sessão no servidor. O frontend usa `httpOnly`, `SameSite=Lax` e `Secure`
  em produção; o token nunca fica acessível ao JavaScript do navegador.

## Contratos e estados úteis para as telas

- **Listagem:** posts em ordem decrescente de criação; paginação somente dos
  posts. Cada item já inclui as replies em ordem crescente. `meta` contém
  `page`, `limit`, `total` e `totalPages`.
- **Detalhe:** usa `id` inteiro positivo. Um ID inválido pode resultar em
  `400`; post inexistente, em `404`.
- **Cadastro:** nome de 1 a 100 caracteres; e-mail válido; senha com pelo
  menos 6 caracteres. E-mail já cadastrado pode resultar em `409`.
- **Login:** e-mail válido e senha com pelo menos 6 caracteres. Credenciais
  inválidas resultam em `401`.
- **Post:** título de 1 a 200 caracteres e conteúdo não vazio. Os campos são
  aparados no servidor.
- **Reply:** conteúdo não vazio, também aparado no servidor.
- **Erros:** respostas de erro seguem o formato `{ error: { code, message,
  details? } }`. Tratar `400` como entrada inválida, `401` como sessão ausente
  ou inválida, `403` como falta de permissão e `404` como recurso inexistente.

## Endpoints adicionais não exigidos pelo braindump

O OpenAPI também oferece atualização de avatar (`PUT /api/me/avatar`),
atualização de imagem do post (`PUT /api/posts/{id}/image`) e exclusão de reply
(`DELETE /api/posts/{id}/replies/{replyId}`). Esses recursos não estão
descritos nas telas e funcionalidades do braindump e, portanto, não foram
incluídos como requisitos do plano inicial.
