"use server";

import { requireAdmin } from "@/lib/require-admin";
import { findPersonByEmail } from "@/lib/services/community/roles";

/** Admin only. Exact email, matched ignoring case. Returns the person's name and avatar to confirm, never the email. */
export async function lookupPersonAction(email: string) {
  const session = await requireAdmin();
  return findPersonByEmail(session.user.id, email);
}
