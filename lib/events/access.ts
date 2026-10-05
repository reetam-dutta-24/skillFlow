/**
 * Who may run a live search.
 * Payments are not wired. Until they are, only an admin can. Replace this function when a plan exists.
 */
export function canUseLiveSearch(role: string | null | undefined): boolean {
  return role === "ADMIN";
}
