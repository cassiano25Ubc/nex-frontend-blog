import Stripe from "stripe";
import { activateUserPremium, ApiError } from "../../../lib/api";

// 4xx do backend é permanente (retry não resolve); o resto é transitório/configuração.
function isRetryable(error: unknown) {
  if (!(error instanceof ApiError)) return true;
  return error.code === "NETWORK_ERROR" || error.status >= 500;
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!secret || !signature) {
    return new Response(null, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // A verificação exige o corpo bruto, sem parse prévio.
    const payload = await request.text();
    event = Stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return new Response(null, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const reference = event.data.object.client_reference_id;
    if (!reference || !/^[1-9]\d*$/.test(reference)) {
      return new Response(null, { status: 400 });
    }
    const userId = Number(reference);
    if (!Number.isSafeInteger(userId)) return new Response(null, { status: 400 });

    try {
      await activateUserPremium(userId);
    } catch (error) {
      const retryable = isRetryable(error);
      const detail =
        error instanceof ApiError ? `${error.code} (${error.status})` : "unknown";
      console.error(
        `[stripe-webhook] falha ao ativar premium do usuário ${userId}: ${detail}`,
      );
      return new Response(null, { status: retryable ? 500 : 400 });
    }
  }

  return new Response(null, { status: 200 });
}
