import type { PostListItem, UserProfile } from "../../src/app/lib/api";

export const mockAuthor = { id: 1, name: "Autora Mock" };

// Segredos usados só nos e2e: o webServer do Playwright os injeta no Next e os testes
// assinam eventos do Stripe com o mesmo segredo.
export const E2E_STRIPE_WEBHOOK_SECRET = "whsec_e2e_secret";
export const E2E_INTERNAL_API_TOKEN = "internal-e2e-token";

// Id determinístico por e-mail: o teste sabe o id do usuário cadastrado pela UI
// (necessário para montar o client_reference_id do webhook) sem acessar o mock.
export function userIdForEmail(email: string): number {
  let hash = 0;
  for (const char of email.toLowerCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) % 900_000;
  }
  return 1000 + hash;
}

export const mockUser = {
  id: 1,
  name: "Autora Mock",
  email: "autora.mock@example.com",
  password: "senha-mock-123",
  avatarUrl: "https://example.com/avatars/autora-mock.png",
  premium: false,
  token: "token-mock-123",
} satisfies UserProfile & { password: string; token: string };

export const mockPosts: PostListItem[] = [
  {
    id: 1,
    title: "Post mockado via MSW",
    content: "Conteúdo do post mockado para os testes e2e.",
    createdAt: "2026-01-02T10:00:00.000Z",
    imageUrl: null,
    premium: false,
    author: mockAuthor,
    likesCount: 3,
    replies: [],
  },
  {
    id: 2,
    title: "Segundo post mockado",
    content: "Outro post retornado pelo mock da API.",
    createdAt: "2026-01-01T10:00:00.000Z",
    imageUrl: null,
    premium: false,
    author: mockAuthor,
    likesCount: 0,
    replies: [],
  },
];
