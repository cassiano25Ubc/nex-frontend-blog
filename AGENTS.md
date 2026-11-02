<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Comunicação com o backend

- Toda chamada ao backend fica em [lib/api.ts](lib/api.ts), usando **axios**. Contrato: [docs/openapi.yaml](docs/openapi.yaml). Ao mudar a API, atualize os dois.
- URL base vem de `BACKEND_URL` (`.env`; modelo em `.env.example`).
- As funções rodam **somente no servidor** (Server Components ou Server Actions). Nunca importe `lib/api.ts` em Client Components.
- Autenticação: o token de sessão fica no cookie httpOnly `token` (`AUTH_COOKIE`) e é enviado como `Authorization: Bearer`. Rotas protegidas lançam `ApiError` 401 sem chamar o backend se não houver cookie; `getPost` usa auth opcional.
- `login` e `register` gravam o cookie; `logout` o apaga. Isso só funciona em Server Actions/Route Handlers, não durante a renderização de Server Components.
- Erros: toda falha vira `ApiError` (`status`, `code`, `message`, `details`), com `code` igual ao do OpenAPI ou `NETWORK_ERROR`. Trate-os nas actions/páginas.
- Uploads de imagem (`updateAvatar`, `updatePostImage`) recebem `File`/`Blob` e enviam multipart no campo `image`.
- Respostas 204 (delete, like/unlike) retornam `void`.

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
