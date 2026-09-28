import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/** Development preview of the signed-in error screen. Production returns 404 instead of throwing. */
export default function DevAppError() {
  if (process.env.NODE_ENV !== "development") notFound();
  throw new Error("SkillFlow development error boundary");
}
