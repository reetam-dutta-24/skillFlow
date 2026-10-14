/**
 * Weak topics: the ideas the explain-back model flagged for this learner. Plain code over saved reviews.
 * An idea the model did not accept, and that is still not passed, ranks first. An idea that took several tries,
 * or a recall answer the model rated weak or partial, ranks after it. One slip that later passed is not weak.
 */

export type WeakMiss = {
  stageId: string;
  /** The idea that was asked. Null for an older whole-stage attempt that named no idea. */
  concept: string | null;
  review: string;
  at: Date;
};

export type WeakRecall = {
  stageId: string;
  concept: string;
  quality: "strong" | "partial" | "weak";
  review: string;
  at: Date;
};

export type WeakStage = {
  id: string;
  title: string;
  image: string | null;
  skillSlug: string;
  skillName: string;
};

export type WeakTopicStatus = "open" | "retried" | "recall";

export type WeakTopic = {
  id: string;
  concept: string;
  stageId: string;
  stageTitle: string;
  image: string | null;
  skillSlug: string;
  skillName: string;
  status: WeakTopicStatus;
  /** How many answers on this idea the model did not accept. */
  misses: number;
  /** The latest written review from the model, on one line. */
  reason: string;
  /** 0 to 1. Share of answers that held, or the recall score. */
  accuracy: number;
  severity: "high" | "medium" | "low";
  href: string;
  action: string;
  lastAt: Date;
};

const RECALL_ACCURACY = { strong: 1, partial: 0.55, weak: 0.2 } as const;

function oneLine(text: string, max = 180) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1)}…`;
}

export function ideaKey(stageId: string, concept: string | null) {
  return `${stageId}::${(concept ?? "").trim().toLowerCase()}`;
}

type Bucket = {
  stageId: string;
  concept: string | null;
  misses: number;
  review: string;
  lastAt: Date;
  recall: WeakRecall | null;
};

export function rankWeakTopics(input: {
  misses: WeakMiss[];
  recalls: WeakRecall[];
  /** ideaKey(stageId, concept) for every idea this learner has passed. */
  passedIdeas: Set<string>;
  passedStages: Set<string>;
  stages: Map<string, WeakStage>;
  limit?: number;
}): WeakTopic[] {
  const buckets = new Map<string, Bucket>();
  const bucket = (stageId: string, concept: string | null) => {
    const key = ideaKey(stageId, concept);
    let row = buckets.get(key);
    if (!row) {
      row = { stageId, concept, misses: 0, review: "", lastAt: new Date(0), recall: null };
      buckets.set(key, row);
    }
    return row;
  };

  for (const miss of input.misses) {
    const row = bucket(miss.stageId, miss.concept);
    row.misses += 1;
    if (miss.at >= row.lastAt) {
      row.lastAt = miss.at;
      row.review = miss.review;
    }
  }

  // Only the latest recall on an idea counts: a strong answer later clears an earlier weak one.
  const latestRecall = new Map<string, WeakRecall>();
  for (const recall of input.recalls) {
    const key = ideaKey(recall.stageId, recall.concept);
    const seen = latestRecall.get(key);
    if (!seen || recall.at > seen.at) latestRecall.set(key, recall);
  }
  for (const recall of latestRecall.values()) {
    if (recall.quality === "strong") continue;
    const row = bucket(recall.stageId, recall.concept);
    row.recall = recall;
    if (recall.at >= row.lastAt) row.lastAt = recall.at;
  }

  const ranked: (WeakTopic & { score: number })[] = [];
  for (const [key, row] of buckets) {
    const stage = input.stages.get(row.stageId);
    if (!stage) continue;
    const passed = row.concept ? input.passedIdeas.has(key) : input.passedStages.has(row.stageId);

    let status: WeakTopicStatus;
    let score: number;
    let accuracy: number;
    if (row.misses > 0 && !passed) {
      status = "open";
      score = 100 + row.misses * 10;
      accuracy = 0;
    } else if (row.recall) {
      status = "recall";
      score = row.recall.quality === "weak" ? 70 : 45;
      accuracy = RECALL_ACCURACY[row.recall.quality];
    } else if (row.misses >= 2) {
      status = "retried";
      score = 30 + row.misses * 5;
      accuracy = 1 / (row.misses + 1);
    } else {
      continue;
    }

    const review = status === "recall" && row.recall ? row.recall.review : row.review;
    ranked.push({
      id: key,
      concept: row.concept ?? stage.title,
      stageId: row.stageId,
      stageTitle: stage.title,
      image: stage.image,
      skillSlug: stage.skillSlug,
      skillName: stage.skillName,
      status,
      misses: row.misses,
      reason: oneLine(review),
      accuracy,
      severity: score >= 100 ? "high" : score >= 45 ? "medium" : "low",
      href: status === "open" ? `/milestone/${row.stageId}` : `/lesson/${row.stageId}`,
      action: status === "open" ? "Try this idea again" : "Revisit the stage",
      lastAt: row.lastAt,
      score,
    });
  }

  return ranked
    .sort((a, b) => b.score - a.score || b.lastAt.getTime() - a.lastAt.getTime())
    .slice(0, input.limit ?? 6)
    .map((topic) => {
      const { score, ...rest } = topic;
      void score;
      return rest;
    });
}
