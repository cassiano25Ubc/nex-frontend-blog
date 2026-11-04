import Stripe from "stripe";

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
    const clientReferenceId = event.data.object.client_reference_id;
    if (!clientReferenceId) return new Response(null, { status: 400 });
    // sem ação por enquanto
  }

  return new Response(null, { status: 200 });
}
