"use server";

const SAVE_MS = 600;

export async function saveSettings(input: { name: string; streakReminder: boolean; fail?: boolean }) {
  await new Promise((resolve) => setTimeout(resolve, SAVE_MS));
  if (input.name.trim().toLowerCase() === "fail this save") return { ok: false as const, error: "The profile could not be saved. Try again." };
  return { ok: true as const };
}
