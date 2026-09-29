"use server";

const SAVE_MS = 600;

export async function submitResource(input: { url: string; title: string }) {
  await new Promise((resolve) => setTimeout(resolve, SAVE_MS));
  if (input.title.trim().toLowerCase() === "fail this submit") {
    return { ok: false as const, error: "The suggestion could not be sent. Try again." };
  }
  if (!input.url.startsWith("https://")) return { ok: false as const, error: "Use an https link." };
  return { ok: true as const };
}
