import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieGet = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieGet, set: vi.fn(), delete: vi.fn() }),
}));

import { ApiError, getMe } from "./api";

describe("lib/api", () => {
  beforeEach(() => {
    cookieGet.mockReset();
  });

  it("lança ApiError 401 sem chamar o backend quando não há cookie", async () => {
    cookieGet.mockReturnValue(undefined);

    await expect(getMe()).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
    await expect(getMe()).rejects.toBeInstanceOf(ApiError);
  });
});
