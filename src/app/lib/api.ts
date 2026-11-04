// Server-only: use in Server Components or Server Actions.
import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { cookies } from "next/headers";

export const AUTH_COOKIE = "token";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export interface ErrorDetail {
  path: string;
  message: string;
}

export interface ErrorResponse {
  error: { code: ErrorCode; message: string; details?: ErrorDetail[] };
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface Author {
  id: number;
  name: string;
}

export interface Reply {
  id: number;
  content: string;
  createdAt: string;
  author: Author;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  imageUrl: string | null;
  author: Author;
}

export interface PostListItem extends Post {
  likesCount: number;
  replies: Reply[];
}

export interface PostDetail extends PostListItem {
  likedByMe: boolean;
}

export interface PostList {
  data: PostListItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
}

export type UpdatePostRequest =
  | { title: string; content?: string }
  | { title?: string; content: string };

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode | "NETWORK_ERROR",
    message: string,
    public details?: ErrorDetail[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const http = axios.create({
  baseURL: process.env.BACKEND_URL,
  headers: { Accept: "application/json" },
});

async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(AUTH_COOKIE)?.value;
}

async function request<T>(
  config: AxiosRequestConfig,
  auth: "required" | "optional" | "none" = "none",
): Promise<T> {
  const headers: Record<string, string> = {};

  if (auth !== "none") {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else if (auth === "required") {
      throw new ApiError(401, "UNAUTHORIZED", "Missing session token");
    }
  }

  try {
    const res = await http.request<T>({
      ...config,
      headers: { ...headers, ...config.headers },
    });
    return res.data;
  } catch (err) {
    if (err instanceof AxiosError && err.response) {
      const body = err.response.data as Partial<ErrorResponse> | undefined;
      throw new ApiError(
        err.response.status,
        body?.error?.code ??
          (err.response.status === 404 ? "NOT_FOUND" : "INTERNAL_ERROR"),
        body?.error?.message ??
          (err.response.status === 404
            ? "Rota não encontrada na API. Verifique se o backend está ativo e se BACKEND_URL aponta para ele."
            : err.message),
        body?.error?.details,
      );
    }
    throw new ApiError(0, "NETWORK_ERROR", (err as Error).message);
  }
}

function imageForm(image: File | Blob): FormData {
  const form = new FormData();
  form.append("image", image);
  return form;
}

// Health
export function getHealth() {
  return request<{ status: "ok" }>({ method: "GET", url: "/health" });
}

// Auth — also stores the session token in the cookie (Server Actions only).
async function saveToken(token: string) {
  (await cookies()).set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function register(data: RegisterRequest) {
  const res = await request<AuthResponse>({
    method: "POST",
    url: "/api/auth/register",
    data,
  });
  await saveToken(res.token);
  return res;
}

export async function login(data: LoginRequest) {
  const res = await request<AuthResponse>({
    method: "POST",
    url: "/api/auth/login",
    data,
  });
  await saveToken(res.token);
  return res;
}

export async function logout() {
  (await cookies()).delete(AUTH_COOKIE);
}

// Me
export function getMe() {
  return request<UserProfile>({ method: "GET", url: "/api/me" }, "required");
}

export function updateAvatar(image: File | Blob) {
  return request<UserProfile>(
    { method: "PUT", url: "/api/me/avatar", data: imageForm(image) },
    "required",
  );
}

// Posts
// Backends que ainda não implementam likes/replies omitem esses campos.
function withDefaults<T extends Post>(post: T) {
  const item = post as Partial<PostDetail> & T;
  return {
    ...item,
    likesCount: item.likesCount ?? 0,
    likedByMe: item.likedByMe ?? false,
    replies: item.replies ?? [],
  };
}

export async function listPosts(page = 1) {
  const list = await request<PostList>({
    method: "GET",
    url: "/api/posts",
    params: { page },
  });
  return { ...list, data: list.data.map(withDefaults) };
}

// Authentication is optional; `likedByMe` is false without a valid session.
export async function getPost(id: number) {
  const post = await request<PostDetail>(
    { method: "GET", url: `/api/posts/${id}` },
    "optional",
  );
  return withDefaults(post);
}

export function createPost(data: CreatePostRequest) {
  return request<Post>(
    { method: "POST", url: "/api/posts", data },
    "required",
  );
}

export function updatePost(id: number, data: UpdatePostRequest) {
  return request<Post>(
    { method: "PUT", url: `/api/posts/${id}`, data },
    "required",
  );
}

export function deletePost(id: number) {
  return request<void>({ method: "DELETE", url: `/api/posts/${id}` }, "required");
}

export function updatePostImage(id: number, image: File | Blob) {
  return request<Post>(
    { method: "PUT", url: `/api/posts/${id}/image`, data: imageForm(image) },
    "required",
  );
}

// Likes
export function likePost(id: number) {
  return request<void>(
    { method: "POST", url: `/api/posts/${id}/likes` },
    "required",
  );
}

export function unlikePost(id: number) {
  return request<void>(
    { method: "DELETE", url: `/api/posts/${id}/likes` },
    "required",
  );
}

// Replies
export function createReply(postId: number, content: string) {
  return request<Reply>(
    { method: "POST", url: `/api/posts/${postId}/replies`, data: { content } },
    "required",
  );
}

export function deleteReply(postId: number, replyId: number) {
  return request<void>(
    { method: "DELETE", url: `/api/posts/${postId}/replies/${replyId}` },
    "required",
  );
}
