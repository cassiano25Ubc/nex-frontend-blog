# Testes de E2E - Autenticação (Cadastro e Login)

## Resumo

Foram criados e executados **9 testes de E2E** cobrindo todo o fluxo de autenticação, garantindo que:
- ✅ Usuários podem se registrar corretamente
- ✅ Usuários podem fazer login com credenciais válidas
- ✅ Validação de erros funciona corretamente
- ✅ Sessão persiste após recarregar a página
- ✅ Logout funciona corretamente

## Testes Criados (em `e2e/auth.spec.ts`)

### 1. **Deve registrar um novo usuário e fazer login**
   - Navega para página de registro
   - Preenche nome, email e senha
   - Verifica redirecionamento para home page
   - Confirma que o usuário está logado (botão "Sair" visível)
   - Verifica que o link "Criar post" está disponível
   - Faz logout e confirma que botão de login reaparece

### 2. **Deve fazer login com credenciais válidas**
   - Navega para página de login
   - Faz login com credenciais do usuário mock
   - Verifica redirecionamento para home page
   - Confirma que o usuário está logado (botão "Sair" visível)

### 3. **Deve exibir erro ao fazer login com credenciais inválidas**
   - Tenta fazer login com email/senha incorretos
   - Verifica que mensagem de erro é exibida: "E-mail ou senha incorretos"
   - Confirma que usuário permanece na página de login

### 4. **Deve validar campos de registro obrigatórios**
   - Tenta enviar formulário sem preencher dados
   - Valida que a página permanece em `/register` (validação HTML5 previne submissão)

### 5. **Deve exibir erro quando tentar registrar com e-mail já cadastrado**
   - Tenta registrar com email que já existe (mock user email)
   - Verifica mensagem de erro: "já está cadastrado"
   - Confirma que usuário permanece na página de registro

### 6. **Deve manter o usuário logado após recarregar a página**
   - Faz login com credenciais válidas
   - Recarrega a página
   - Verifica que usuário continua logado
   - Confirma que token no cookie httpOnly persiste

### 7. **Deve navegar entre login e registro**
   - Navega de login para registro
   - Verifica que ambas as páginas estão acessíveis
   - Verifica que os links de navegação funcionam corretamente

### 8-9. Testes de Home Page
   - Acesso à página inicial funciona
   - Posts mockados via MSW são exibidos corretamente

## Resultados

```
Running 9 tests using 6 workers

✅ 9 passed (5.9s)
```

## Mocks Utilizados

### Handlers MSW Atualizados (`e2e/mocks/handlers.ts`)

Adicionados handlers para:
- **POST `/api/auth/register`** - Cria novo usuário e retorna token
- **POST `/api/auth/login`** - Autentica usuário e retorna token
- **POST `/api/auth/logout`** - Invalida sessão
- **GET `/api/me`** - Retorna dados do usuário autenticado

Os handlers validam:
- Emails duplicados (retorna 409)
- Credenciais inválidas (retorna 401)
- Tokens ausentes (retorna 401 para rotas protegidas)

## Como Rodar os Testes

```bash
# Rodar todos os testes de E2E
npm run test:e2e

# Rodar apenas testes de autenticação
npm run test:e2e -- auth.spec.ts

# Rodar com UI interativo
npm run test:e2e -- --ui
```

## Estrutura de Cookies (httpOnly)

O sistema usa cookies httpOnly seguros para armazenar o token de autenticação:
- **Nome**: `token`
- **Tipo**: httpOnly (não acessível via JavaScript)
- **Duração**: 30 dias
- **SameSite**: lax
- **Secure**: true em produção

Isso garante que:
1. ✅ O token persiste entre recarregamentos
2. ✅ O token é enviado automaticamente em requisições ao backend
3. ✅ O token é protegido contra XSS (não acessível via JS)

## Fluxo de Autenticação Testado

```
┌─────────────────────────────────────────────────────────────────┐
│                    Fluxo de Autenticação                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. REGISTRO                                                    │
│     ├─ Input: name, email, password                            │
│     ├─ POST /api/auth/register                                 │
│     ├─ Salva token em cookie httpOnly                          │
│     └─ Redireciona para /                                       │
│                                                                 │
│  2. LOGIN                                                       │
│     ├─ Input: email, password                                  │
│     ├─ POST /api/auth/login                                    │
│     ├─ Salva token em cookie httpOnly                          │
│     └─ Redireciona para /                                       │
│                                                                 │
│  3. PERSISTÊNCIA                                               │
│     ├─ Token no cookie persiste entre requisições             │
│     ├─ GET /api/me valida token e retorna usuário            │
│     └─ Header mostra "Sair" quando autenticado                 │
│                                                                 │
│  4. LOGOUT                                                      │
│     ├─ POST /api/auth/logout (melhor esforço)                 │
│     ├─ Apaga cookie do token                                   │
│     └─ Redireciona para /                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Validações Implementadas

✅ **Registro:**
- Email válido (validação de formato)
- Senha mínima de 6 caracteres
- Nome não pode estar vazio
- Email não pode ser duplicado

✅ **Login:**
- Email válido (validação de formato)
- Senha mínima de 6 caracteres
- Credentials corretas (email + senha)

✅ **Sessão:**
- Token persiste em cookie httpOnly
- Token é validado em requisições protegidas
- Logout invalida a sessão

## Arquivos Modificados

- ✏️ `e2e/auth.spec.ts` - **Criado** com 7 testes de autenticação
- ✏️ `e2e/mocks/handlers.ts` - **Atualizado** com handlers de autenticação
- ✏️ `e2e/home.spec.ts` - **Atualizado** para usar heading "Posts" correto
