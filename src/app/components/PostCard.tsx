import Link from "next/link";
import type { PostListItem } from "../lib/api";
import { formatDate } from "../lib/format";

export default function PostCard({ post }: { post: PostListItem }) {
  return (
    <article className="card card-border bg-base-100 sm:card-side">
      {post.imageUrl && (
        <figure className="sm:w-56 sm:shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt={post.title}
            className="h-full w-full object-cover"
          />
        </figure>
      )}
      <div className="card-body">
        <h2 className="card-title">
          <Link href={`/posts/${post.id}`} className="hover:underline">
            {post.title}
          </Link>
          {post.premium && <span className="badge badge-accent">Premium</span>}
        </h2>
        <p className="line-clamp-3">{post.content}</p>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm opacity-70">
          <span>
            {post.author.name} · {formatDate(post.createdAt)}
          </span>
          <span className="flex gap-2">
            <span className="badge badge-ghost">♥ {post.likesCount}</span>
            <span className="badge badge-ghost">
              💬 {post.replies.length}
            </span>
          </span>
        </div>
        <div className="card-actions justify-end">
          <Link href={`/posts/${post.id}`} className="btn btn-primary btn-sm">
            Ler mais
          </Link>
        </div>
      </div>
    </article>
  );
}
