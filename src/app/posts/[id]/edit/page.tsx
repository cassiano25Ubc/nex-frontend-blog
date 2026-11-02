import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import PostForm from "../../../components/PostForm";
import { ApiError, AUTH_COOKIE } from "../../../lib/api";
import { getOwnedPost } from "../../../lib/owned-post";
import { updatePostAction } from "../../../post-actions";

async function EditPostContent({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isSafeInteger(postId) || postId < 1) notFound();
  if (!(await cookies()).has(AUTH_COOKIE)) redirect("/login");

  let post;
  try {
    post = await getOwnedPost(postId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/session/expired");
    }
    if (
      error instanceof ApiError &&
      (error.status === 403 || error.status === 404)
    ) {
      notFound();
    }
    if (error instanceof ApiError) {
      return (
        <div className="alert alert-error" role="alert">
          Não foi possível carregar o post para edição: {error.message}
        </div>
      );
    }
    throw error;
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-6">
      <div>
        <Link className="link" href={`/posts/${postId}`}>
          ← Voltar ao post
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Editar post</h1>
      </div>
      <PostForm
        action={updatePostAction.bind(null, postId)}
        initialContent={post.content}
        initialTitle={post.title}
        submitLabel="Salvar alterações"
      />
    </section>
  );
}

export default function EditPostPage({
  params,
}: PageProps<"/posts/[id]/edit">) {
  return (
    <Suspense fallback={<span className="loading loading-spinner loading-lg mx-auto" />}>
      <EditPostContent params={params} />
    </Suspense>
  );
}
