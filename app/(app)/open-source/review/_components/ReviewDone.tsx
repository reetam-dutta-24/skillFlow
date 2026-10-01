const MESSAGE: Record<string, string> = {
  merged: "Merged. It is public in that niche now.",
  changes: "Sent back. The author can see your note.",
  closed: "Closed.",
};

/** The short note after a decision. The action redirects here with `?done=`. */
export function ReviewDone({ done, next = false }: { done: string; next?: boolean }) {
  const message = MESSAGE[done];
  if (!message) return null;
  return (
    <p className="sf-os-done" role="status">
      {message}
      {next ? " Here is the next one." : ""}
    </p>
  );
}
