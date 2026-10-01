import Link from "next/link";

export function AdminSectionNav({ current }: { current: "submissions" | "catalog" | "creator" | "community" }) {
  return (
    <nav className="sf-admin-tabs" aria-label="Admin sections">
      <Link href="/admin/submissions" aria-current={current === "submissions" ? "page" : undefined}>
        Submissions
      </Link>
      <Link href="/admin/catalog" aria-current={current === "catalog" ? "page" : undefined}>
        Catalog
      </Link>
      <Link href="/admin/creator" aria-current={current === "creator" ? "page" : undefined}>
        Creator videos
      </Link>
      <Link href="/admin/community" aria-current={current === "community" ? "page" : undefined}>
        Community
      </Link>
    </nav>
  );
}
