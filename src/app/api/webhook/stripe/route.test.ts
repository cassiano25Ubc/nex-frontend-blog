import { beforeEach, describe, expect, it, vi } from "vitest";

const activateUserPremium = vi.hoisted(() => vi.fn());
const constructEvent = vi.hoisted(() => vi.fn());

vi.mock("stripe", () => ({
  default: { webhooks: { constructEvent } },
}));

vi.mock("../../../lib/api", () => {
  class ApiError extends Error {
    constructor(
      public status: number,
      public code: string,
      message: string,
    ) {
      super(message);
    }
  }
  return { ApiError, activateUserPremium };
});

import { ApiError } from "../../../lib/api";
import { POST } from "./route";

function webhook(signature: string | null = "sig") {
  return new Request("http://localhost/api/webhook/stripe", {
    method: "POST",
    body: "{}",
    headers: signature ? { "stripe-signature": signature } : {},
  });
}

function completed(reference: string | null) {
  constructEvent.mockReturnValue({
    type: "checkout.session.completed",
    data: { object: { client_reference_id: reference } },
  });
}

describe("POST /api/webhook/stripe", () => {
  beforeEach(() => {
    activateUserPremium.mockReset();
    constructEvent.mockReset();
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("responde 400 sem assinatura", async () => {
    expect((await POST(webhook(null))).status).toBe(400);
  });

  it("responde 400 com assinatura inválida", async () => {
    constructEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });
    expect((await POST(webhook())).status).toBe(400);
    expect(activateUserPremium).not.toHaveBeenCalled();
  });

  it("ativa o premium e responde 200", async () => {
    completed("42");
    activateUserPremium.mockResolvedValue(undefined);

    expect((await POST(webhook())).status).toBe(200);
    expect(activateUserPremium).toHaveBeenCalledWith(42);
  });

  it("responde 400 quando client_reference_id é inválido", async () => {
    completed("abc");
    expect((await POST(webhook())).status).toBe(400);
    expect(activateUserPremium).not.toHaveBeenCalled();
  });

  it("responde 500 em erro de rede ou 5xx para o Stripe tentar de novo", async () => {
    completed("42");
    activateUserPremium.mockRejectedValue(new ApiError(0, "NETWORK_ERROR", "down"));
    expect((await POST(webhook())).status).toBe(500);

    activateUserPremium.mockRejectedValue(new ApiError(500, "INTERNAL_ERROR", "boom"));
    expect((await POST(webhook())).status).toBe(500);
  });

  it("responde 400 em erro permanente 4xx", async () => {
    completed("42");
    activateUserPremium.mockRejectedValue(new ApiError(404, "NOT_FOUND", "no user"));
    expect((await POST(webhook())).status).toBe(400);
  });

  it("ignora outros tipos de evento", async () => {
    constructEvent.mockReturnValue({ type: "charge.succeeded", data: { object: {} } });
    expect((await POST(webhook())).status).toBe(200);
    expect(activateUserPremium).not.toHaveBeenCalled();
  });
});
