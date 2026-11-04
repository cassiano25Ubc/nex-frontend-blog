"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ApiError,
  AUTH_COOKIE,
  createPost,
  deletePost,
  getPost,
  likePost,
  unlikePost,
  updatePost,
  updatePostImage,
} from "./lib/api";
import { getOwnedPost } from "./lib/owned-post";

export interface PostFormState {
  error?: string;
  fieldErrors?: {
    title?: string;
    content?: string;
    image?: string;
  };
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function readImage(formData: FormData): File | null {
  const value = formData.get("image");
  return value instanceof File && value.size > 0 ? value : null;
}

function validateImage(image: File | null): string | undefined {
  if (!image) return undefined;
  if (!IMAGE_TYPES.includes(image.type)) {
    return "Envie uma imagem JPEG, PNG ou WebP.";
  }
  if (image.size > MAX_IMAGE_BYTES) return "A imagem deve ter até 5 MB.";
  return undefined;
}

export interface DeletePostState {
  error?: string;
}

export interface LikeState {
  liked: boolean;
  likesCount: number;
  error?: string;
}

async function redirectForAuthError(): Promise<never> {
  const hasToken = (await cookies()).has(AUTH_COOKIE);
  redirect(hasToken ? "/session/expired" : "/login");
}

function readText(formData: FormData, field: "title" | "content") {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function isValidPostId(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const postId = Number(value);
  return Number.isSafeInteger(postId) ? postId : null;
}

function apiErrorMessage(error: ApiError) {
  if (error.code === "NETWORK_ERROR") {
    return "Não foi possível conectar ao servidor. Tente novamente.";
  }
  if (error.status === 401) {
    return "Sua sessão expirou. Entre novamente para continuar.";
  }
  if (error.status === 403) {
    return "Você não tem permissão para alterar este post.";
  }
  if (error.status === 404) {
    return "Este post não foi encontrado.";
  }
  return error.message;
}

function validatePost(title: string, content: string): PostFormState {
  const fieldErrors: NonNullable<PostFormState["fieldErrors"]> = {};

  if (!title || title.length > 200) {
    fieldErrors.title = "Informe um título com até 200 caracteres.";
  }
  if (!content) {
    fieldErrors.content = "O conteúdo do post não pode ficar vazio.";
  }

  return Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {};
}

export async function createPostAction(
  _previousState: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const title = readText(formData, "title");
  const content = readText(formData, "content");
  const validation = validatePost(title, content);
  if (validation.fieldErrors) return validation;

  let post;
  try {
    post = await createPost({
      title,
      content,
      ...(formData.get("premium") === "on" && { premium: true }),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) await redirectForAuthError();
      if (error.status === 403) {
        return { error: "Apenas usuários premium podem criar posts premium." };
      }
      return { error: apiErrorMessage(error) };
    }
    throw error;
  }

  revalidatePath("/");
  redirect(`/posts/${post.id}`);
}

export async function updatePostAction(
  postId: number,
  _previousState: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const title = readText(formData, "title");
  const content = readText(formData, "content");
  const validation = validatePost(title, content);
  if (validation.fieldErrors) return validation;

  const image = readImage(formData);
  const imageError = validateImage(image);
  if (imageError) return { fieldErrors: { image: imageError } };

  try {
    await getOwnedPost(postId);
    // Imagem primeiro: é a etapa que mais falha (formato/tamanho); assim, se falhar, nada foi gravado.
    if (image) await updatePostImage(postId, image);
    await updatePost(postId, { title, content });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) await redirectForAuthError();
      if (error.status === 404) redirect("/");
      return { error: apiErrorMessage(error) };
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  revalidatePath(`/posts/${postId}/edit`);
  redirect(`/posts/${postId}`);
}

export async function deletePostAction(
  _previousState: DeletePostState,
  formData: FormData,
): Promise<DeletePostState> {
  const postId = isValidPostId(formData.get("postId"));
  if (!postId) return { error: "Post inválido." };

  try {
    await getOwnedPost(postId);
    await deletePost(postId);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) await redirectForAuthError();
      return { error: apiErrorMessage(error) };
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  revalidatePath(`/posts/${postId}/edit`);
  redirect("/");
}

export async function toggleLikeAction(
  postId: number,
  _previousState: LikeState,
  _formData: FormData,
): Promise<LikeState> {
  if (!Number.isSafeInteger(postId) || postId < 1) {
    return {
      liked: false,
      likesCount: 0,
      error: "Post inválido.",
    };
  }

  try {
    const post = await getPost(postId);
    if (post.likedByMe) {
      await unlikePost(postId);
    } else {
      await likePost(postId);
    }

    const updatedPost = await getPost(postId);
    revalidatePath("/");
    revalidatePath(`/posts/${postId}`);

    return {
      liked: updatedPost.likedByMe,
      likesCount: updatedPost.likesCount,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) await redirectForAuthError();
      if (error.status === 404) redirect("/");
      return {
        liked: _previousState.liked,
        likesCount: _previousState.likesCount,
        error: apiErrorMessage(error),
      };
    }
    throw error;
  }
}
