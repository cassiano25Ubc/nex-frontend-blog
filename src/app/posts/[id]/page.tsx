import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ApiError, getPost } from "../../lib/api";
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

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold">{post.title}</h1>
        <p className="text-sm opacity-70">
          {post.author.name} · {formatDate(post.createdAt)}
        </p>
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

      <div className="badge badge-ghost">♥ {post.likesCount} curtidas</div>

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
              </li>
            ))}
          </ul>
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
