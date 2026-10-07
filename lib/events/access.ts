/** Live search is part of Premium. An admin can use it without a charge. */
export function canUseLiveSearch(input: { role?: string | null; premium: boolean }) {
  return input.role === "ADMIN" || input.premium;
}
