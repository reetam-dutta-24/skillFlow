import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/** Development preview of the public error screen. Production returns 404 instead of throwing. */
export default function DevRootError() {
  if (process.env.NODE_ENV !== "development") notFound();
  throw new Error("SkillFlow development error boundary");
}
