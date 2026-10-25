import "dotenv/config";
import { embedderConfig } from "@/lib/assistant/embed";
import { indexEverything } from "@/lib/assistant/store";
import { prisma } from "@/lib/prisma";

/**
 * Builds the SkillFlow Assistant's retrieval index: content/help, the tour, the feature list, and the catalog.
 * Idempotent and safe to rerun: only new or changed chunks are embedded, and chunks whose source is gone are deleted.
 *
 *   npm run assistant:index                      # everything
 *   npm run assistant:index -- --delay=0         # no pause between batches (a paid key); Gemini's default is 30 s
 *   npm run assistant:index -- --if-empty        # only when the table is empty (the end-to-end setup uses this)
 */
async function main() {
  const args = process.argv.slice(2);
  const delayArg = args.find((arg) => arg.startsWith("--delay="));
  const embedder = embedderConfig();
  // Gemini's free tier counts embeddings per minute: 50 every 30 s stays inside it. Pass --delay=0 on a paid key.
  const delayMs = delayArg ? Math.max(0, Number(delayArg.split("=")[1]) || 0) : embedder?.provider === "gemini" ? 30_000 : 0;

  if (args.includes("--if-empty")) {
    const [row] = await prisma.$queryRaw<{ n: number }[]>`SELECT count(*)::int AS n FROM "KnowledgeChunk"`;
    if ((row?.n ?? 0) > 0) {
      console.log(`index already has ${row.n} chunks; nothing to do`);
      return;
    }
  }

  console.log(embedder ? `embedding with ${embedder.model} (${embedder.provider})` : "no embedding key: chunks are stored for keyword search only");
  const started = Date.now();
  const counts = await indexEverything({ delayMs, log: (line) => console.log(line) });
  console.log(`embedded ${counts.embedded} / unchanged ${counts.unchanged} / deleted ${counts.deleted} / skipped ${counts.skipped} in ${((Date.now() - started) / 1000).toFixed(1)} s`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
