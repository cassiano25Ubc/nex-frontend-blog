"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ApiError,
  AUTH_COOKIE,
  createReply,
  deleteReply,
  getMe,
  getPost,
} from "./lib/api";

export interface ReplyFormState {
  error?: string;
  success?: boolean;
}

export interface DeleteReplyState {
  error?: string;
}

async function redirectForAuthError(): Promise<never> {
  const hasToken = (await cookies()).has(AUTH_COOKIE);
  redirect(hasToken ? "/session/expired" : "/login");
}

function parseId(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function apiErrorMessage(error: ApiError) {
  if (error.code === "NETWORK_ERROR") {
    return "Não foi possível conectar ao servidor. Tente novamente.";
  }
  if (error.status === 401) {
    return "Sua sessão expirou. Entre novamente para continuar.";
  }
  if (error.status === 403) {
    return "Você só pode apagar as suas próprias respostas.";
  }
  if (error.status === 404) {
    return "Post ou resposta não encontrado.";
  }
  return error.message;
}

export async function createReplyAction(
  postId: number,
  _previousState: ReplyFormState,
  formData: FormData,
): Promise<ReplyFormState> {
  const raw = formData.get("content");
  const content = typeof raw === "string" ? raw.trim() : "";
  if (!content) return { error: "Escreva algo antes de responder." };

  try {
    await createReply(postId, content);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) await redirectForAuthError();
      return { error: apiErrorMessage(error) };
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  return { success: true };
}

export async function deleteReplyAction(
  _previousState: DeleteReplyState,
  formData: FormData,
): Promise<DeleteReplyState> {
  const postId = parseId(formData.get("postId"));
  const replyId = parseId(formData.get("replyId"));
  if (!postId || !replyId) return { error: "Resposta inválida." };

  try {
    const [me, post] = await Promise.all([getMe(), getPost(postId)]);
    const reply = post.replies.find((item) => item.id === replyId);
    if (!reply) return { error: "Post ou resposta não encontrado." };
    if (reply.author.id !== me.id) {
      return { error: "Você só pode apagar as suas próprias respostas." };
    }
    await deleteReply(postId, replyId);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) await redirectForAuthError();
      return { error: apiErrorMessage(error) };
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  return {};
}
