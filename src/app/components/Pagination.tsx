import Link from "next/link";

const href = (page: number) => (page === 1 ? "/" : `/?page=${page}`);

export default function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav aria-label="Paginação" className="join mx-auto">
      {page > 1 ? (
        <Link href={href(page - 1)} className="join-item btn">
          «
        </Link>
      ) : (
        <button className="join-item btn" disabled>
          «
        </button>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={`join-item btn ${p === page ? "btn-active" : ""}`}
        >
          {p}
        </Link>
      ))}
      {page < totalPages ? (
        <Link href={href(page + 1)} className="join-item btn">
          »
        </Link>
      ) : (
        <button className="join-item btn" disabled>
          »
        </button>
      )}
    </nav>
  );
}
