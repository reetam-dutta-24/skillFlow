const MESSAGE: Record<string, string> = {
  merged: "Published. Anyone signed in can read it.",
  changes: "Sent back. The author can see your note.",
  closed: "Rejected. It stays off the public list.",
  unmerged: "Hidden. It is off the public list.",
  created: "Submitted. It stays hidden until a moderator publishes it.",
  edited: "Saved. It is back in the review queue.",
  resubmitted: "Sent again. It stays hidden until a moderator publishes it.",
  withdrawn: "Withdrawn. It stays in your list and off the public list.",
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
