import { http, HttpResponse } from "msw";
import type { AuthResponse, Post, PostList, UserProfile } from "../../src/app/lib/api";
import { E2E_INTERNAL_API_TOKEN, mockPosts, mockUser, userIdForEmail } from "./data";

// Usuários promovidos a premium (via webhook simulado). Fonte única do flag premium.
const premiumUsers: Set<number> = new Set();
// Falha forçada do checkout por e-mail, para testar o tratamento de erro.
const CHECKOUT_FAIL_EMAIL_PREFIX = "checkout-fail";

// In-memory storage for registered users during tests
const registeredUsers: Map<string, { name: string; email: string; password: string; id: number }> = new Map();

// In-memory storage for created posts during tests
// Start with mock posts and add new ones as they're created
let postsStore: Post[] = mockPosts.map(p => ({ ...p, likedByMe: false }));
let nextPostId = Math.max(...mockPosts.map(p => p.id)) + 1;

// Track valid tokens
const validTokens: Map<string, { userId: number; email: string }> = new Map();

// Track likes: map of postId -> Set of userIds who liked it
const userLikes: Map<number, Set<number>> = new Map();

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
    const userId = userIdForEmail(body.email);
    registeredUsers.set(body.email, {
      name: body.name,
      email: body.email,
      password: body.password,
      id: userId,
    });

    // Generate and store token
    const token = `token-${Date.now()}-${userId}`;
    validTokens.set(token, { userId, email: body.email });

    // Return auth response
    const response: AuthResponse = {
      token,
      user: {
        id: userId,
        name: body.name,
        email: body.email,
        avatarUrl: null,
        premium: premiumUsers.has(userId),
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
      const token = mockUser.token;
      validTokens.set(token, { userId: mockUser.id, email: mockUser.email });
      
      const response: AuthResponse = {
        token,
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
      const token = `token-${Date.now()}-${user.id}`;
      validTokens.set(token, { userId: user.id, email: user.email });
      
      const response: AuthResponse = {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: null,
          premium: premiumUsers.has(user.id),
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
  http.post("*/api/auth/logout", ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      // O token do usuário fixo é compartilhado entre workers; não o invalida.
      if (token !== mockUser.token) validTokens.delete(token);
    }
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

    const token = authHeader.replace("Bearer ", "");
    const tokenData = validTokens.get(token);

    if (!tokenData) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Token inválido" } },
        { status: 401 },
      );
    }

    // Return user based on token
    if (tokenData.email === mockUser.email) {
      const response: UserProfile = {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        avatarUrl: mockUser.avatarUrl,
        premium: mockUser.premium,
      };
      return HttpResponse.json(response);
    }

    const registeredUser = registeredUsers.get(tokenData.email);
    if (registeredUser) {
      const response: UserProfile = {
        id: registeredUser.id,
        name: registeredUser.name,
        email: registeredUser.email,
        avatarUrl: null,
        premium: premiumUsers.has(registeredUser.id),
      };
      return HttpResponse.json(response);
    }

    return HttpResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Usuário não encontrado" } },
      { status: 401 },
    );
  }),

  // Me - Checkout (nunca devolve URL do Stripe: aponta para a própria home)
  http.post("*/api/me/checkout", ({ request }) => {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const tokenData = token ? validTokens.get(token) : undefined;
    if (!tokenData) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Token inválido" } },
        { status: 401 },
      );
    }
    if (premiumUsers.has(tokenData.userId)) {
      return HttpResponse.json(
        { error: { code: "CONFLICT", message: "Usuário já é premium" } },
        { status: 409 },
      );
    }
    if (tokenData.email.startsWith(CHECKOUT_FAIL_EMAIL_PREFIX)) {
      return HttpResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Falha no checkout" } },
        { status: 500 },
      );
    }
    return HttpResponse.json({ url: "http://localhost:3002/?checkout=success&e2e=checkout" });
  }),

  // Internal - Marca usuário como premium (chamado pelo webhook do Stripe)
  http.put("*/api/internal/users/:id/premium", ({ request, params }) => {
    if (request.headers.get("X-Internal-Token") !== E2E_INTERNAL_API_TOKEN) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Token interno inválido" } },
        { status: 401 },
      );
    }
    premiumUsers.add(Number(params.id));
    return new HttpResponse(null, { status: 204 });
  }),

  // Posts - List posts
  http.get("*/api/posts", ({ request }) => {
    const url = new URL(request.url);
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const limit = 10;
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const currentUserId = token ? validTokens.get(token)?.userId : null;

    const total = postsStore.length;

    const startIdx = (page - 1) * limit;
    const endIdx = startIdx + limit;
    const paginatedPosts = postsStore.slice(startIdx, endIdx).map(post => ({
      ...post,
      likedByMe: currentUserId ? (userLikes.get(post.id)?.has(currentUserId) ?? false) : false,
    }));

    const body: PostList = {
      data: paginatedPosts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };

    return HttpResponse.json(body);
  }),

  // Posts - Get single post
  http.get("*/api/posts/:id", ({ request, params }) => {
    const post = postsStore.find((p) => p.id === Number(params.id));
    if (!post) {
      return HttpResponse.json(
        { error: { code: "NOT_FOUND", message: "Post não encontrado" } },
        { status: 404 },
      );
    }

    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const currentUserId = token ? validTokens.get(token)?.userId : null;
    const likedByMe = currentUserId ? (userLikes.get(post.id)?.has(currentUserId) ?? false) : false;

    return HttpResponse.json({ ...post, likedByMe });
  }),

  // Posts - Create post
  http.post("*/api/posts", async ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Token ausente" } },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const tokenData = validTokens.get(token);

    if (!tokenData) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Token inválido" } },
        { status: 401 },
      );
    }

    const body = await request.json() as { title: string; content: string; premium?: boolean };

    // Validate input
    if (!body.title || body.title.length > 200) {
      return HttpResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Título inválido" } },
        { status: 400 },
      );
    }

    if (!body.content) {
      return HttpResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Conteúdo inválido" } },
        { status: 400 },
      );
    }

    // Determine author
    let authorName = mockUser.name;
    if (tokenData.email !== mockUser.email) {
      const registeredUser = registeredUsers.get(tokenData.email);
      if (registeredUser) {
        authorName = registeredUser.name;
      }
    }

    // Create new post
    const newPost: Post = {
      id: nextPostId++,
      title: body.title,
      content: body.content,
      createdAt: new Date().toISOString(),
      imageUrl: null,
      likesCount: 0,
      likedByMe: false,
      replies: [],
      premium: body.premium ?? false,
      author: {
        id: tokenData.userId,
        name: authorName,
      },
    };

    // Add to store (insert at beginning so newest posts are first)
    postsStore.unshift(newPost);

    return HttpResponse.json(newPost);
  }),

  // Posts - Update post
  http.put("*/api/posts/:id", async ({ request, params }) => {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Token ausente" } },
        { status: 401 },
      );
    }

    const postId = Number(params.id);
    const post = postsStore.find((p) => p.id === postId);

    if (!post) {
      return HttpResponse.json(
        { error: { code: "NOT_FOUND", message: "Post não encontrado" } },
        { status: 404 },
      );
    }

    const body = await request.json() as { title?: string; content?: string };

    if (body.title !== undefined) post.title = body.title;
    if (body.content !== undefined) post.content = body.content;

    return HttpResponse.json(post);
  }),

  // Posts - Delete post
  http.delete("*/api/posts/:id", ({ request, params }) => {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Token ausente" } },
        { status: 401 },
      );
    }

    const postId = Number(params.id);
    const index = postsStore.findIndex((p) => p.id === postId);

    if (index === -1) {
      return HttpResponse.json(
        { error: { code: "NOT_FOUND", message: "Post não encontrado" } },
        { status: 404 },
      );
    }

    postsStore.splice(index, 1);
    return HttpResponse.json({});
  }),

  // Posts - Like post
  http.post("*/api/posts/:id/likes", ({ request, params }) => {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Token ausente" } },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const tokenData = validTokens.get(token);

    if (!tokenData) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Token inválido" } },
        { status: 401 },
      );
    }

    const postId = Number(params.id);
    const post = postsStore.find((p) => p.id === postId);

    if (!post) {
      return HttpResponse.json(
        { error: { code: "NOT_FOUND", message: "Post não encontrado" } },
        { status: 404 },
      );
    }

    // Track like
    if (!userLikes.has(postId)) {
      userLikes.set(postId, new Set());
    }

    const likers = userLikes.get(postId)!;
    if (!likers.has(tokenData.userId)) {
      likers.add(tokenData.userId);
      post.likesCount += 1;
    }

    return HttpResponse.json({});
  }),

  // Posts - Unlike post
  http.delete("*/api/posts/:id/likes", ({ request, params }) => {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Token ausente" } },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const tokenData = validTokens.get(token);

    if (!tokenData) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Token inválido" } },
        { status: 401 },
      );
    }

    const postId = Number(params.id);
    const post = postsStore.find((p) => p.id === postId);

    if (!post) {
      return HttpResponse.json(
        { error: { code: "NOT_FOUND", message: "Post não encontrado" } },
        { status: 404 },
      );
    }

    // Remove like
    const likers = userLikes.get(postId);
    if (likers && likers.has(tokenData.userId)) {
      likers.delete(tokenData.userId);
      post.likesCount = Math.max(0, post.likesCount - 1);
    }

    return HttpResponse.json({});
  }),
];
