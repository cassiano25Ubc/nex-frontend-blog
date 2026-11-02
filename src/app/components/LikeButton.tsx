"use client";

import { useActionState } from "react";
import {
  toggleLikeAction,
  type LikeState,
} from "../post-actions";

export default function LikeButton({
  postId,
  initialLiked,
  initialLikesCount,
}: {
  postId: number;
  initialLiked: boolean;
  initialLikesCount: number;
}) {
  const initialState: LikeState = {
    liked: initialLiked,
    likesCount: initialLikesCount,
  };
  const action = toggleLikeAction.bind(null, postId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="flex flex-col items-start gap-2">
      <form action={formAction}>
        <button
          aria-pressed={state.liked}
          className={`btn btn-sm ${state.liked ? "btn-primary" : "btn-outline"}`}
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <span aria-hidden="true">{state.liked ? "♥" : "♡"}</span>
          )}
          {state.liked ? "Curtido" : "Curtir"}
          <span className="badge badge-sm">{state.likesCount}</span>
        </button>
      </form>
      {state.error && (
        <p className="text-sm text-error" role="alert">
          {state.error}
        </p>
      )}
    </div>
  );
}
