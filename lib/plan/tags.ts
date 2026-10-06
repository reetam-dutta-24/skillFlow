export type TagField = "durationMinutes" | "depth" | "isCore" | "captionLanguages";
export type TagSource = "admin" | "model" | "catalog";
export type TagOrigins = Partial<Record<TagField, TagSource>>;

export type ResourceTags = {
  durationMinutes: number | null;
  depth: "INTRO" | "STANDARD" | "DEEP" | null;
  isCore: boolean;
  captionLanguages: string[];
};

const FIELDS: TagField[] = ["durationMinutes", "depth", "isCore", "captionLanguages"];

export function readTagOrigins(value: unknown): TagOrigins {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const origins: TagOrigins = {};
  for (const field of FIELDS) {
    const source = (value as Record<string, unknown>)[field];
    if (source === "admin" || source === "model" || source === "catalog") origins[field] = source;
  }
  return origins;
}

function sameTags(left: unknown, right: unknown) {
  if (Array.isArray(left) && Array.isArray(right)) return left.length === right.length && left.every((item, index) => item === right[index]);
  return left === right;
}

/** A model may fill a tag only when an admin has not set it, and a catalog file may not replace an admin value. */
export function mergeResourceTags(
  existing: ResourceTags,
  origins: TagOrigins,
  incoming: Partial<ResourceTags>,
  source: TagSource,
): { tags: ResourceTags; origins: TagOrigins; changed: boolean } {
  const tags = { ...existing, captionLanguages: [...existing.captionLanguages] };
  const nextOrigins = { ...origins };
  let changed = false;
  for (const field of FIELDS) {
    if (!(field in incoming)) continue;
    const value = incoming[field];
    if (value === undefined) continue;
    if (source !== "admin" && origins[field] === "admin") continue;
    const current = existing[field];
    if (sameTags(current, value)) continue;
    if (field === "captionLanguages") tags.captionLanguages = [...(value as string[])];
    else if (field === "durationMinutes") tags.durationMinutes = value as number | null;
    else if (field === "depth") tags.depth = value as ResourceTags["depth"];
    else tags.isCore = value as boolean;
    nextOrigins[field] = source;
    changed = true;
  }
  return { tags, origins: nextOrigins, changed };
}
