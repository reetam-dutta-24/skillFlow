export async function register() {
  // Only on the Node server, and not during `next build` (Docker builds have no secrets).
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { validateEnv } = await import("./lib/env");
  validateEnv();
}