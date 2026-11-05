import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ApiError, listPosts } from "./lib/api";
import PostCard from "./components/PostCard";
import Pagination from "./components/Pagination";

async function PostList({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[]; checkout?: string }>;
}) {
  await connection();
  const { page, checkout } = await searchParams;
  const raw = Array.isArray(page) ? page[0] : page;
  const current = Math.max(1, Number.parseInt(raw ?? "1", 10) || 1);

  let result;
  try {
    result = await listPosts(current);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Erro inesperado";
    return (
      <div role="alert" className="alert alert-error">
        Não foi possível carregar os posts: {message}
      </div>
    );
  }

  const { data, meta } = result;

  if (data.length === 0) {
    return (
      <div role="alert" className="alert">
        Nenhum post encontrado.{" "}
        {current > 1 && (
          <Link href="/" className="link">
            Voltar ao início
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      {checkout === "success" && (
        <div role="alert" className="alert alert-success">
          ✓ Pagamento recebido! O acesso premium é liberado em instantes; recarregue a página.
        </div>
      )}
      {checkout === "cancel" && (
        <div role="alert" className="alert alert-warning">
          ✕ Pagamento cancelado.
        </div>
      )}
      <div className="flex flex-col gap-4">
        {data.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      <Pagination page={meta.page} totalPages={meta.totalPages} />
    </>
  );
}

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Posts</h1>
      <Suspense
        fallback={<span className="loading loading-spinner loading-lg mx-auto" />}
      >
        <PostList searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
