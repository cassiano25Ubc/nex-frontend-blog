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

Pré-requisito: a API do blog em execução (por padrão em `http://localhost:3000`).

```bash
npm install
cp .env.example .env   # ajuste BACKEND_URL se necessário
npm run dev
```

Abra [http://localhost:3002](http://localhost:3002).

> A porta 3001 costuma ser usada pelo Bull Dashboard do backend, por isso o frontend roda na **3002**.

## Variáveis de ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `BACKEND_URL` | `http://localhost:3000` | URL base da API do blog |

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento (porta 3002) |
| `npm run build` | Build de produção |
| `npm run start` | Executa o build de produção (porta 3002) |

## Documentação

- [Plano de integração](docs/plan.md)
- [Contrato da API (OpenAPI)](docs/openapi.yaml)
- [Requisitos iniciais](docs/braindump.md)
