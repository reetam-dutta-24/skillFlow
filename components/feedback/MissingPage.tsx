import Link from "next/link";
import { EmptyState } from "./EmptyState.jsx";

export function MissingPage({
  homeHref,
  placement = "screen",
}: {
  homeHref: string;
  placement?: "screen" | "content";
}) {
  return (
    <div className={placement === "content" ? "sf-boundary-inset" : "sf-boundary"}>
      <div className="sf-boundary-card">
        <EmptyState
          icon="search"
          titleAs="h1"
          title="This page is not here"
          description="The link may be old, or the page may have moved."
          action={
            <Link className="sf-boundary-link" href={homeHref}>
              Back to home
            </Link>
          }
        />
      </div>
    </div>
  );
}
