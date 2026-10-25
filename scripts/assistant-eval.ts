import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { evalFileSchema, firstHit, metrics, type EvalOutcome } from "@/lib/assistant/eval";
import { explainBackGuard } from "@/lib/assistant/intent";
import { loadGuardStages } from "@/lib/assistant/learner-context";
import { COVERAGE_WEIGHT, MIN_COSINE, MIN_COVERAGE, RRF_K } from "@/lib/assistant/rank";
import { retrieve } from "@/lib/assistant/retrieval";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";

/**
 * Retrieval-only evaluation of the SkillFlow Assistant against content/help/_eval.json. No generation, no model call
 * except the query embeddings. Prints Recall@5, MRR, not-sure accuracy, and hint-mode accuracy for a free learner who
 * has passed nothing yet.
 *
 *   npm run assistant:eval
 *   npm run assistant:eval -- --k=40 --cos=0.62 --cov=0.5 --cw=0.006 --verbose     # tuning
 */

const NOBODY = "assistant-eval-nobody"; // no rows: every stage counts as not passed

function flag(name: string, fallback: number) {
  const arg = process.argv.find((item) => item.startsWith(`--${name}=`));
  const value = arg ? Number(arg.split("=")[1]) : NaN;
  return Number.isFinite(value) ? value : fallback;
}

async function main() {
  const k = flag("k", RRF_K);
  const minCosine = flag("cos", MIN_COSINE);
  const minCoverage = flag("cov", MIN_COVERAGE);
  const coverageWeight = flag("cw", COVERAGE_WEIGHT);
  const verbose = process.argv.includes("--verbose");
  const file = evalFileSchema.parse(JSON.parse(await readFile(path.join(process.cwd(), "content", "help", "_eval.json"), "utf8")));

  const outcomes: EvalOutcome[] = [];
  let vectorUsed = 0;
  for (const question of file.questions) {
    const result = await retrieve(question.question, { premium: false, k, minCosine, minCoverage, coverageWeight });
    if (result.usedVector) vectorUsed += 1;
    const keys = result.sources.map((row) => row.sourceKey);
    let predicted: EvalOutcome["predicted"] = "not-sure";
    if (result.sources.length) {
      const topStageIds = result.sources.slice(0, 3).map((row) => row.stageId);
      const stages = await loadGuardStages(NOBODY, topStageIds.filter((id): id is string => Boolean(id)));
      predicted = explainBackGuard({ question: question.question, topStageIds, stages, firstKind: result.sources[0]?.kind }).mode;
    }
    outcomes.push({ question, keys, predicted });
    const rank = firstHit(keys, question.expect);
    const ok = (question.expect.length === 0 || (rank !== null && rank <= 5)) && predicted === question.mode;
    if (verbose || !ok) {
      const top = result.ranked.slice(0, 3).map((row) => `${row.sourceKey} cos=${(row.cosine ?? 0).toFixed(3)} cov=${row.coverage.toFixed(2)}`).join(" | ");
      console.log(`${ok ? "ok  " : "MISS"} ${question.id}: rank=${rank ?? "-"} mode=${predicted}/${question.mode}  top: ${top}`);
    }
  }

  const result = metrics(outcomes, 5);
  console.log("");
  console.log(`questions ${result.counts.total} (retrievable ${result.counts.retrievable}), vector search used on ${vectorUsed}`);
  console.log(`k=${k} minCosine=${minCosine} minCoverage=${minCoverage} coverageWeight=${coverageWeight}`);
  console.log(`Recall@5          ${(result.recallAtK * 100).toFixed(1)}%`);
  console.log(`MRR               ${result.mrr.toFixed(3)}`);
  console.log(`Not-sure accuracy ${(result.notSureAccuracy * 100).toFixed(1)}%`);
  console.log(`Hint-mode accuracy ${(result.hintAccuracy * 100).toFixed(1)}%`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  // The query-vector cache opens a Redis connection, which would keep the process alive.
  .finally(async () => {
    await prisma.$disconnect();
    await getRedis()?.quit().catch(() => undefined);
  });
