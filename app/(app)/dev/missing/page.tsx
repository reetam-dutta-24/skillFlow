import { notFound } from "next/navigation";

/** Development preview of the signed-in not-found screen. Production returns the same 404. */
export default function DevAppMissing() {
  notFound();
}
