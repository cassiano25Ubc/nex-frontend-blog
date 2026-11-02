"use client";

import { useActionState, useRef } from "react";
import { deleteReplyAction } from "../reply-actions";

export default function DeleteReplyButton({
  postId,
  replyId,
}: {
  postId: number;
  replyId: number;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(deleteReplyAction, {});

  return (
    <>
      <button
        className="btn btn-error btn-outline btn-xs"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        Apagar
      </button>
      <dialog className="modal" ref={dialogRef}>
        <div className="modal-box">
          <h2 className="text-lg font-bold">Apagar esta resposta?</h2>
          <p className="py-4">Esta ação é permanente.</p>
          {state.error && (
            <div className="alert alert-error" role="alert">
              <span>{state.error}</span>
            </div>
          )}
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-ghost">Cancelar</button>
            </form>
            <form action={formAction}>
              <input name="postId" type="hidden" value={postId} />
              <input name="replyId" type="hidden" value={replyId} />
              <button className="btn btn-error" disabled={pending} type="submit">
                {pending && <span className="loading loading-spinner loading-sm" />}
                {pending ? "Apagando..." : "Confirmar exclusão"}
              </button>
            </form>
          </div>
        </div>
        <form className="modal-backdrop" method="dialog">
          <button>Fechar</button>
        </form>
      </dialog>
    </>
  );
}
