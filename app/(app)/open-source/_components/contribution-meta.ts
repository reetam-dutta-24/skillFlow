/** How each contribution type looks: an icon and one of the four categorical color slots (app/globals.css --viz-*). */
export const TYPE_META: Record<string, { label: string; icon: string; slot: 1 | 2 | 3 | 4 }> = {
  RESOURCE: { label: "Resource", icon: "link", slot: 1 },
  FOLLOW: { label: "Follow", icon: "user-plus", slot: 2 },
  LEARNING_PATH: { label: "Learning path", icon: "list-ordered", slot: 3 },
  CONCEPT_NOTE: { label: "Concept note", icon: "lightbulb", slot: 4 },
};

export function typeMeta(type: string) {
  return TYPE_META[type] ?? { label: type, icon: "git-pull-request", slot: 1 as const };
}

/** The type filter, in the order the tabs show. An empty id is every type. */
export const TYPE_FILTERS = [
  { id: "", label: "All", icon: "layout-grid" },
  { id: "RESOURCE", label: "Resources", icon: "link" },
  { id: "CONCEPT_NOTE", label: "Concept notes", icon: "lightbulb" },
  { id: "LEARNING_PATH", label: "Learning paths", icon: "list-ordered" },
  { id: "FOLLOW", label: "Follows", icon: "user-plus" },
] as const;

/** "29 Sep 2026" */
export function shortDay(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}
