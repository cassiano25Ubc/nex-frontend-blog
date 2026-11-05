import type { PostListItem, UserProfile } from "../../src/app/lib/api";

export const mockAuthor = { id: 1, name: "Autora Mock" };

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
