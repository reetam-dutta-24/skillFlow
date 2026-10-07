import { z } from "zod";

/**
 * The shape of the written report. Lenient on purpose: too-long text is cut and extra list entries are dropped, so one
 * over-long sentence from the model does not throw away the whole report. Kept apart from report.ts so it can be tested.
 */
/** Text that must exist; anything longer than the cap is cut instead of failing the whole report. */
const text = (min: number, max: number) => z.string().trim().min(min).transform((value) => value.slice(0, max));
/** A list with a floor; extra entries past the cap are dropped instead of failing. */
const list = <T extends z.ZodTypeAny>(entry: T, min: number, max: number) => z.array(entry).min(min).transform((value) => value.slice(0, max));
const item = z.object({ title: text(2, 80), detail: text(10, 420) });
/** Models sometimes send a tip as { title, detail } instead of a string; both are accepted. */
const tip = z
  .union([
    z.string(),
    z.object({ title: z.string().optional(), detail: z.string().optional(), text: z.string().optional() }).passthrough(),
  ])
  .transform((value) => (typeof value === "string" ? value : [value.title, value.detail ?? value.text].filter(Boolean).join(": ")))
  .pipe(text(10, 260));
export const reportSchema = z.object({
  summary: text(40, 900),
  workStyle: text(20, 600),
  strengths: list(item, 3, 6),
  watchOuts: list(item, 2, 5),
  paths: list(
    z.object({
      slug: z.string(),
      why: text(20, 500),
      approach: list(text(8, 260), 3, 6),
      firstWeek: text(10, 320),
    }),
    1,
    5,
  ),
  growth: list(tip, 2, 4),
});

export type ReportBody = z.output<typeof reportSchema>;
