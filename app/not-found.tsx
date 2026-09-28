import type { Metadata } from "next";
import { MissingPage } from "@/components/feedback/MissingPage";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <MissingPage homeHref="/" />;
}
