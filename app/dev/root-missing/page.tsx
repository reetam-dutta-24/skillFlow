import { notFound } from "next/navigation";

/** Development preview of the public not-found screen. Production returns the same 404. */
export default function DevRootMissing() {
  notFound();
}
