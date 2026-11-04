# Nex Frontend Blog

Frontend de um blog feito com **Next.js 16** (App Router), **React 19**, **Tailwind CSS 4** e **daisyUI 5**. Ele consome uma API REST separada (contrato em [`docs/openapi.yaml`](docs/openapi.yaml)).

## Funcionalidades

- Cadastro, login e logout (token em cookie `httpOnly`, validado no servidor)
- Listagem paginada de posts e página individual do post
- Criar, editar e apagar posts (somente o autor; rota de edição protegida)
- Upload de imagem do post na página de edição (JPEG, PNG ou WebP, até 5 MB)
- Curtir e descurtir posts
- Responder posts e apagar as próprias respostas (formulário desabilitado para visitantes)

## Estrutura do projeto

```text
nex-frontend-blog/
├── docs/                      # Documentação do projeto
│   ├── braindump.md           #   Requisitos e ideias iniciais
│   ├── openapi.yaml           #   Contrato da API (OpenAPI)
│   └── plan.md                #   Plano de integração front ↔ API
├── public/                    # Arquivos estáticos (SVGs)
├── src/
│   └── app/                   # App Router do Next.js
│       ├── components/        #   Componentes de UI
│       │   ├── AuthForm.tsx           # Formulário de login/cadastro
│       │   ├── DeletePostButton.tsx   # Apagar post (modal de confirmação)
│       │   ├── DeleteReplyButton.tsx  # Apagar resposta
│       │   ├── Header.tsx             # Cabeçalho e sessão do usuário
│       │   ├── LikeButton.tsx         # Curtir / descurtir
│       │   ├── Pagination.tsx         # Paginação da listagem
│       │   ├── PostCard.tsx           # Card de post na listagem
│       │   ├── PostForm.tsx           # Criar/editar post (com imagem)
│       │   └── ReplyForm.tsx          # Responder um post
│       ├── lib/               #   Código de apoio (somente servidor)
│       │   ├── api.ts                 # Cliente da API (axios) e ApiError
│       │   ├── format.ts              # Formatação de datas
│       │   └── owned-post.ts          # Verifica se o post é do usuário
│       ├── login/             #   Página /login
│       ├── register/          #   Página /register
│       ├── posts/
│       │   ├── [id]/          #   Página /posts/:id
│       │   │   └── edit/      #   Página /posts/:id/edit (protegida)
│       │   └── new/           #   Página /posts/new (protegida)
│       ├── session/
│       │   └── expired/       #   Rota que limpa o cookie e volta ao login
│       ├── auth-actions.ts    #   Server Actions: login e cadastro
│       ├── post-actions.ts    #   Server Actions: posts, imagem e likes
│       ├── reply-actions.ts   #   Server Actions: respostas
│       ├── layout.tsx         #   Layout raiz
│       ├── page.tsx           #   Página inicial (listagem)
│       └── globals.css        #   Estilos globais (Tailwind + daisyUI)
├── .env.example               # Modelo das variáveis de ambiente
├── next.config.ts             # Configuração do Next.js
├── package.json               # Scripts e dependências
└── tsconfig.json              # Configuração do TypeScript
```

## Rotas

| Rota | Acesso | Descrição |
| --- | --- | --- |
| `/` | Público | Lista de posts paginada |
| `/posts/[id]` | Público | Post, curtidas e respostas |
| `/posts/new` | Logado | Criar post |
| `/posts/[id]/edit` | Autor do post | Editar post e imagem |
| `/login` | Público | Entrar |
| `/register` | Público | Criar conta |
| `/session/expired` | Interna | Encerra sessão inválida e redireciona ao login |

## Como rodar

O frontend consome a API REST do projeto irmão
[`NODE-API-BLOG`](../NODE-API-BLOG/README.md), por padrão em
`http://localhost:3000`. As configurações de cada aplicação ficam em arquivos
de ambiente separados.

### Primeira execução

```powershell
cd ..\NODE-API-BLOG
Copy-Item .env.example .env   # só se .env ainda não existir
npm install
npm run db:up
npm run db:migrate

cd ..\nex-frontend-blog
Copy-Item .env.example .env.local   # só se .env.local ainda não existir
npm install
npm run dev:all
```

O script `dev:all` inicia os containers do banco, banco de teste e Mailpit,
depois inicia a API e o frontend. Para iniciar cada servidor separadamente,
use `npm run dev` no backend e `npm run dev` no frontend em terminais distintos.
Abra [http://localhost:3002](http://localhost:3002).
O Docker Desktop precisa estar aberto antes de executar `npm run dev:all`.

> O frontend usa a porta **3002** para manter a API do backend na porta **3000**.

### Variáveis do frontend

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `BACKEND_URL` | `http://localhost:3000` | URL base da API do blog |

Configure-a em `.env.local` no frontend. Se a porta da API mudar, atualize essa
URL. `PORT` é configuração do backend; a porta do frontend continua definida
pelos scripts do Next.js.

### Variáveis do backend

O arquivo [`NODE-API-BLOG/.env.example`](../NODE-API-BLOG/.env.example) é a
referência para configurar a API. Ele documenta:

| Variável | Uso |
| --- | --- |
| `PORT` | Porta HTTP da API (padrão `3000`) |
| `DATABASE_URL` | Conexão PostgreSQL da aplicação |
| `DATABASE_URL_TEST` | Conexão PostgreSQL usada nos testes |
| `UPLOADS_DIR` | Diretório de imagens enviadas |
| `SMTP_HOST`, `SMTP_PORT`, `MAIL_FROM` | Envio de e-mails; em desenvolvimento, usa Mailpit |
| `MAILPIT_API_URL` | API do Mailpit usada pelos testes; padrão `http://localhost:8025` |

Não copie variáveis ou segredos do backend para o ambiente do frontend. O
backend atual não implementa Redis nem Stripe; variáveis `REDIS_URL` ou
`STRIPE_*` não habilitam esses recursos. A chave secreta do Stripe nunca deve
ser exposta ao frontend.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento (porta 3002) |
| `npm run dev:all` | Inicia banco, Mailpit, backend e frontend no Windows |
| `npm run build` | Build de produção |
| `npm run start` | Executa o build de produção (porta 3002) |

## Documentação

- [Plano de integração](docs/plan.md)
- [Contrato da API (OpenAPI)](docs/openapi.yaml)
- [Requisitos iniciais](docs/braindump.md)

## Usar a API no Insomnia

O contrato OpenAPI pode ser importado diretamente como uma coleção:

1. Inicie o backend em `http://localhost:3000` (ou ajuste o endereço em
   `docs/openapi.yaml`).
2. No Insomnia, escolha **Import** → **File** e selecione
   `docs/openapi.yaml`.
3. Envie `POST /api/auth/login` ou `POST /api/auth/register` com os dados da
   sua conta. Copie o campo `token` da resposta.
4. Nas requisições protegidas, configure **Auth** com o esquema HTTP de token
   de acesso e informe o token copiado. O contrato identifica essas operações
   com o esquema `BearerAuth`.

O Insomnia acessa a API do backend diretamente; `BACKEND_URL` é uma variável do
frontend e não é necessária para executar as requisições no Insomnia. O token
deve ser mantido no ambiente local do Insomnia e não compartilhado ou commitado.
