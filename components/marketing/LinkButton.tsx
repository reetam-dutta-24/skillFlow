import React from "react";
import Link from "next/link";

const SIZES = {
  sm: { height: 32, radius: "var(--radius-btn-sm)", padding: "0 14px", font: "var(--text-xs)" },
  md: { height: 40, radius: "var(--radius-btn)", padding: "0 20px", font: "var(--text-sm)" },
  lg: { height: 44, radius: "var(--radius-btn)", padding: "0 24px", font: "var(--text-sm)" },
  xl: { height: 52, radius: "var(--radius-btn)", padding: "0 28px", font: "var(--text-subtitle)" },
};

export interface LinkButtonProps {
  href: string;
  variant?: "gradient" | "outline";
  size?: keyof typeof SIZES;
  pill?: boolean;
  full?: boolean;
  children: React.ReactNode;
  className?: string;
}

// A real <a> (via next/link) styled to match core/Button.jsx's look — for
// CTAs on Server Component pages (landing, auth) where the destination is a
// genuine navigation, not a client-side action, so it should be a real link:
// crawlable, prefetched, works without JS, opens in a new tab on request.
export function LinkButton({ href, variant = "outline", size = "md", pill = false, full = false, children, className }: LinkButtonProps) {
  const s = SIZES[size] || SIZES.md;
  return (
    <Link
      href={href}
      className={["sf-link-btn", `sf-link-btn-${variant}`, className].filter(Boolean).join(" ")}
      style={{
        height: s.height,
        padding: s.padding,
        borderRadius: pill ? "var(--radius-full)" : s.radius,
        fontSize: s.font,
        width: full ? "100%" : undefined,
      }}
    >
      {children}
    </Link>
  );
}
