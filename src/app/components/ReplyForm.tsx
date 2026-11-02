"use client";

import { useActionState, useEffect, useRef } from "react";
import { createReplyAction, type ReplyFormState } from "../reply-actions";

export default function ReplyForm({ postId }: { postId: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = createReplyAction.bind(null, postId);
  const [state, formAction, pending] = useActionState<ReplyFormState, FormData>(
    action,
    {},
  );

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-2" ref={formRef}>
      <label className="sr-only" htmlFor="reply-content">
        Sua resposta
      </label>
      <textarea
        className="textarea textarea-bordered w-full"
        disabled={pending}
        id="reply-content"
        name="content"
        placeholder="Escreva sua resposta..."
        required
        rows={3}
      />
      {state.error && (
        <p className="text-sm text-error" role="alert">
          {state.error}
        </p>
      )}
      <button
        className="btn btn-primary btn-sm w-fit"
        disabled={pending}
        type="submit"
      >
        {pending && <span className="loading loading-spinner loading-sm" />}
        {pending ? "Enviando..." : "Responder"}
      </button>
    </form>
  );
}
