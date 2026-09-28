import Link from "next/link";

/** Landing action. Matches Button sizing, and navigates as a link. */
export function CtaLink({ href, variant = "gradient", size = "lg", children }) {
  const tone = variant === "outline" ? "sf-cta-outline" : "sf-cta-gradient";
  const scale = size === "sm" ? "sf-cta-sm" : "";
  return (
    <Link href={href} className={["sf-cta", tone, scale].filter(Boolean).join(" ")}>
      {children}
    </Link>
  );
}
