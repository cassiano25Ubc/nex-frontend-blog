import { http, HttpResponse } from "msw";
import type { AuthResponse, PostList, UserProfile } from "../../src/app/lib/api";
import { mockPosts, mockUser } from "./data";

// In-memory storage for registered users during tests
const registeredUsers: Map<string, { name: string; email: string; password: string }> = new Map();

export const handlers = [
  // Auth - Register
  http.post("*/api/auth/register", async ({ request }) => {
    const body = await request.json() as { name: string; email: string; password: string };
    
    // Check if email already exists
    if (registeredUsers.has(body.email) || body.email === mockUser.email) {
      return HttpResponse.json(
        { error: { code: "CONFLICT", message: "E-mail já cadastrado" } },
        { status: 409 },
      );
    }

    // Validate input
    if (!body.name || !body.email || !body.password) {
      return HttpResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Dados de cadastro inválidos" } },
        { status: 400 },
      );
    }

    // Store the user
    registeredUsers.set(body.email, {
      name: body.name,
      email: body.email,
      password: body.password,
    });

    // Return auth response
    const response: AuthResponse = {
      token: `token-${Date.now()}`,
      user: {
        id: Math.floor(Math.random() * 10000),
        name: body.name,
        email: body.email,
        avatarUrl: null,
        premium: false,
      },
    };

    return HttpResponse.json(response);
  }),

  // Auth - Login
  http.post("*/api/auth/login", async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    // Check credentials against registered users or mock user
    const user = registeredUsers.get(body.email);
    
    if (body.email === mockUser.email && body.password === mockUser.password) {
      const response: AuthResponse = {
        token: mockUser.token,
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          avatarUrl: mockUser.avatarUrl,
          premium: mockUser.premium,
        },
      };
      return HttpResponse.json(response);
    }

    if (user && user.password === body.password) {
      const response: AuthResponse = {
        token: `token-${Date.now()}`,
        user: {
          id: Math.floor(Math.random() * 10000),
          name: user.name,
          email: user.email,
          avatarUrl: null,
          premium: false,
        },
      };
      return HttpResponse.json(response);
    }

    return HttpResponse.json(
      { error: { code: "UNAUTHORIZED", message: "E-mail ou senha incorretos" } },
      { status: 401 },
    );
  }),

  // Auth - Logout
  http.post("*/api/auth/logout", () => {
    return HttpResponse.json({});
  }),

  // Me - Get current user
  http.get("*/api/me", ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Token ausente" } },
        { status: 401 },
      );
    }

    // For this test, any valid token returns the mock user
    const response: UserProfile = {
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      avatarUrl: mockUser.avatarUrl,
      premium: mockUser.premium,
    };

    return HttpResponse.json(response);
  }),

  // Posts
  http.get("*/api/posts", ({ request }) => {
    const url = new URL(request.url);
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const limit = 10;
    const total = mockPosts.length;

    const body: PostList = {
      data: page === 1 ? mockPosts : [],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };

    return HttpResponse.json(body);
  }),

  http.get("*/api/posts/:id", ({ params }) => {
    const post = mockPosts.find((p) => p.id === Number(params.id));
    if (!post) {
      return HttpResponse.json(
        { error: { code: "NOT_FOUND", message: "Post não encontrado" } },
        { status: 404 },
      );
    }
    return HttpResponse.json({ ...post, likedByMe: false });
  }),
];
