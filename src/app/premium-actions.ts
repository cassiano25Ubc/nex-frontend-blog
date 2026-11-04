"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, AUTH_COOKIE, createCheckout } from "./lib/api";

export interface CheckoutState {
  error?: string;
}

export async function checkoutAction(
  _previousState: CheckoutState,
): Promise<CheckoutState> {
  let url: string;
  try {
    ({ url } = await createCheckout());
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.status === 401) {
      const hasToken = (await cookies()).has(AUTH_COOKIE);
      redirect(hasToken ? "/session/expired" : "/login");
    }
    if (error.status === 409) return { error: "Você já é premium." };
    if (error.code === "NETWORK_ERROR") {
      return { error: "Não foi possível conectar ao servidor. Tente novamente." };
    }
    return { error: "Não foi possível iniciar o pagamento. Tente novamente." };
  }

  redirect(url);
}
