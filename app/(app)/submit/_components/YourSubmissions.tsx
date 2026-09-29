import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnSubmissions } from "@/lib/data/submissions";
import { Chip } from "@/components/core/Chip.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";

const TONE = { PENDING: "warn", APPROVED: "pass", REJECTED: "fail" } as const;

export async function YourSubmissions() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const items = await getOwnSubmissions({ id: session.user.id, name: session.user.name ?? null });
  if (!items.length) {
    return <EmptyState compact icon="file-plus" title="No suggestions yet" description="A resource you send will show up here with its review status." />;
  }
  return (
    <ul className="sf-submission-list">
      {items.map((item) => (
        <li key={item.id}>
          <div>
            <strong>{item.title}</strong>
            <p>{item.skillName} · {item.stageTitle}</p>
            {item.status === "REJECTED" && item.reviewNotes ? <p>{item.reviewNotes}</p> : null}
          </div>
          <Chip tone={TONE[item.status]}>{item.status === "PENDING" ? "Pending" : item.status === "APPROVED" ? "Approved" : "Rejected"}</Chip>
          <Link href={item.url} target="_blank" rel="noopener noreferrer">Open link, opens in a new tab</Link>
        </li>
      ))}
    </ul>
  );
}
