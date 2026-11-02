"use client";

import { useActionState } from "react";
import type { PostFormState } from "../post-actions";

type PostAction = (
  previousState: PostFormState,
  formData: FormData,
) => Promise<PostFormState>;

export default function PostForm({
  action,
  initialTitle = "",
  initialContent = "",
  submitLabel,
}: {
  action: PostAction;
  initialTitle?: string;
  initialContent?: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="card card-border bg-base-100">
      <div className="card-body gap-5">
        {state.error && (
          <div className="alert alert-error" role="alert">
            <span>{state.error}</span>
          </div>
        )}

        <label className="form-control flex flex-col gap-2">
          <span className="label-text font-medium">Título</span>
          <input
            className={`input w-full ${state.fieldErrors?.title ? "input-error" : ""}`}
            defaultValue={initialTitle}
            id="title"
            maxLength={200}
            name="title"
            required
            aria-invalid={Boolean(state.fieldErrors?.title)}
            aria-describedby={state.fieldErrors?.title ? "title-error" : undefined}
          />
          {state.fieldErrors?.title && (
            <span className="text-sm text-error" id="title-error">
              {state.fieldErrors.title}
            </span>
          )}
        </label>

        <label className="form-control flex flex-col gap-2">
          <span className="label-text font-medium">Conteúdo</span>
          <textarea
            className={`textarea min-h-64 w-full ${state.fieldErrors?.content ? "textarea-error" : ""}`}
            defaultValue={initialContent}
            id="content"
            name="content"
            placeholder="Escreva seu post..."
            required
            aria-invalid={Boolean(state.fieldErrors?.content)}
            aria-describedby={state.fieldErrors?.content ? "content-error" : undefined}
          />
          {state.fieldErrors?.content && (
            <span className="text-sm text-error" id="content-error">
              {state.fieldErrors.content}
            </span>
          )}
        </label>

        <div className="card-actions justify-end">
          <button className="btn btn-primary" disabled={pending} type="submit">
            {pending && <span className="loading loading-spinner loading-sm" />}
            {pending ? "Salvando..." : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
