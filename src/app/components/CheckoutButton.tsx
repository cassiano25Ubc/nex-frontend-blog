"use client";

import { useActionState } from "react";
import { checkoutAction } from "../premium-actions";

export default function CheckoutButton() {
  const [state, formAction, pending] = useActionState(checkoutAction, {});

  return (
    <form action={formAction} className="flex items-center gap-2">
      {state.error && (
        <span className="text-xs text-error" role="alert">
          {state.error}
        </span>
      )}
      <button className="btn btn-accent btn-sm" disabled={pending} type="submit">
        {pending && <span className="loading loading-spinner loading-xs" />}
        Virar premium
      </button>
    </form>
  );
}
