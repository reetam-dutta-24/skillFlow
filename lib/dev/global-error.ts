/**
 * Development-only switch for the root error boundary.
 * Set LEARNPROOF_DEV_GLOBAL_ERROR=1 and restart the dev server, then open any page.
 * Leave it unset for normal browsing. Production never throws.
 */
export function throwGlobalErrorInDev() {
  if (process.env.NODE_ENV !== "development") return;
  if (process.env.LEARNPROOF_DEV_GLOBAL_ERROR !== "1") return;
  throw new Error("LearnProof development global error boundary");
}
