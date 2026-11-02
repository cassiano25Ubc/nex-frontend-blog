import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, AUTH_COOKIE, getMe, getPost } from "../../lib/api";
import DeletePostButton from "../../components/DeletePostButton";
import LikeButton from "../../components/LikeButton";
import ReplyForm from "../../components/ReplyForm";
import DeleteReplyButton from "../../components/DeleteReplyButton";
import { formatDate } from "../../lib/format";

async function PostContent({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId) || postId < 1) notFound();

  let post;
  try {
    post = await getPost(postId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    const message = err instanceof ApiError ? err.message : "Erro inesperado";
    return (
      <div role="alert" className="alert alert-error">
        Não foi possível carregar o post: {message}
      </div>
    );
  }

  let userId: number | null = null;
  let sessionLookupFailed = false;
  if ((await cookies()).has(AUTH_COOKIE)) {
    try {
      const user = await getMe();
      userId = user.id;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        redirect("/session/expired");
      }
      if (!(error instanceof ApiError)) throw error;
      sessionLookupFailed = true;
    }
  }

  const isOwner = userId === post.author.id;

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold">{post.title}</h1>
            <p className="text-sm opacity-70">
              {post.author.name} · {formatDate(post.createdAt)}
            </p>
          </div>
          {isOwner && (
            <div className="flex gap-2">
              <Link
                className="btn btn-outline btn-sm"
                href={`/posts/${post.id}/edit`}
              >
                Editar
              </Link>
              <DeletePostButton postId={post.id} />
            </div>
          )}
        </div>
      </header>

      {post.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.imageUrl}
          alt={post.title}
          className="w-full rounded-box"
        />
      )}

      <p className="whitespace-pre-line text-lg leading-relaxed">
        {post.content}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {userId !== null ? (
          <LikeButton
            initialLiked={post.likedByMe}
            initialLikesCount={post.likesCount}
            postId={post.id}
          />
        ) : (
          <span className="badge badge-ghost">
            ♥ {post.likesCount} curtidas
          </span>
        )}
        {userId === null && !sessionLookupFailed && (
          <p className="text-sm text-base-content/70">
            <Link className="link link-primary" href="/login">
              Entre
            </Link>{" "}
            para curtir este post.
          </p>
        )}
        {sessionLookupFailed && (
          <p className="text-sm text-warning" role="status">
            Não foi possível validar sua sessão para curtir.
          </p>
        )}
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">
          Respostas ({post.replies.length})
        </h2>
        {post.replies.length === 0 ? (
          <div role="alert" className="alert">
            Ainda não há respostas.
          </div>
        ) : (
          <ul className="list bg-base-100 rounded-box shadow-sm">
            {post.replies.map((reply) => (
              <li key={reply.id} className="list-row">
                <div className="list-col-grow">
                  <div className="text-sm font-semibold">
                    {reply.author.name}
                    <span className="ml-2 font-normal opacity-60">
                      {formatDate(reply.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-line">{reply.content}</p>
                </div>
                {userId === reply.author.id && (
                  <DeleteReplyButton postId={post.id} replyId={reply.id} />
                )}
              </li>
            ))}
          </ul>
        )}
        {userId !== null ? (
          <ReplyForm postId={post.id} />
        ) : (
          !sessionLookupFailed && (
            <p className="text-sm text-base-content/70">
              <Link className="link link-primary" href="/login">
                Entre
              </Link>{" "}
              para responder.
            </p>
          )
        )}
      </section>
    </article>
  );
}

export default function PostPage({ params }: PageProps<"/posts/[id]">) {
  return (
    <div className="flex flex-col gap-4">
      <Link href="/" className="link w-fit">
        ← Voltar
      </Link>
      <Suspense
        fallback={<span className="loading loading-spinner loading-lg mx-auto" />}
      >
        <PostContent params={params} />
      </Suspense>
    </div>
  );
}
