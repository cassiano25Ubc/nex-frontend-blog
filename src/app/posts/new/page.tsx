import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import PostForm from "../../components/PostForm";
import { createPostAction } from "../../post-actions";
import { ApiError, getMe } from "../../lib/api";

async function NewPostContent() {
  await connection();

  if (!(await cookies()).has("token")) redirect("/login");

  try {
    await getMe();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/session/expired");
    }
    if (error instanceof ApiError) redirect("/login");
    throw error;
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-6">
      <div>
        <Link className="link" href="/">
          ← Voltar
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Criar post</h1>
      </div>
      <PostForm action={createPostAction} submitLabel="Publicar post" />
    </section>
  );
}

export default function NewPostPage() {
  return (
    <Suspense fallback={<span className="loading loading-spinner loading-lg mx-auto" />}>
      <NewPostContent />
    </Suspense>
  );
}
