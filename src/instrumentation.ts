// Ativa o mock MSW do backend somente quando MSW_ENABLED=true (ex.: testes e2e).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.MSW_ENABLED !== "true") return;

  const { server } = await import("../e2e/mocks/server");
  server.listen();
}
