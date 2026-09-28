import "server-only";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Admin screens call this. Signed-in learners get a 404. Everyone else goes to login. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") notFound();
  return session;
}
