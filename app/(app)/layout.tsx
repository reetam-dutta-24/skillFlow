import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "SkillFlow",
    template: "%s | SkillFlow",
  },
  robots: {
    index: false,
    follow: false,
  },
};

/** Authenticated route group. The shell is added in a later phase. No pages live here yet. */
export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return children;
}
