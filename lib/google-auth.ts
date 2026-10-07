/** Google sign-in is on only when both keys are set. Pages read this to show or hide the button. */
export function googleAuthEnabled() {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

/** Lowercase and trim, so "Ana@Gmail.com" and "ana@gmail.com" are one account. */
export function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}
