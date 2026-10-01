const MESSAGE: Record<string, string> = {
  merged: "Merged. It is public in that niche now.",
  changes: "Sent back. The author can see your note.",
  closed: "Closed.",
  unmerged: "Unmerged. It is hidden from the niche, and a gap it resolved is open again.",
  gap: "Gap reported. It is listed under Gaps.",
  created: "Submitted. It stays hidden until a reviewer merges it.",
  edited: "Saved as a new revision. It is back in the review queue.",
  resubmitted: "Resubmitted. It is hidden from the niche until it is reviewed again.",
  withdrawn: "Withdrawn. It is closed and stays in your list.",
};

/** The short note after an action. Actions redirect with `?done=` or `?saved=`. */
export function DoneNote({ done, next = false }: { done: string; next?: boolean }) {
  const message = MESSAGE[done];
  if (!message) return null;
  return (
    <p className="sf-os-done" role="status">
      {message}
      {next ? " Here is the next one." : ""}
    </p>
  );
}
