"use client";

import { useRef } from "react";
import { useActionState } from "react";
import { deletePostAction } from "../post-actions";

export default function DeletePostButton({ postId }: { postId: number }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(deletePostAction, {});

  return (
    <>
      <button
        className="btn btn-error btn-outline btn-sm"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        Apagar post
      </button>
      <dialog className="modal" ref={dialogRef}>
        <div className="modal-box">
          <h2 className="text-lg font-bold">Apagar este post?</h2>
          <p className="py-4">
            Esta ação é permanente e também remove as curtidas e respostas do post.
          </p>
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
