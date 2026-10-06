export function recordDate(value: Date | null): string {
  if (!value) return "Passed";
  return value.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** A niche is complete only when every stage on that path has a passed explain-back. */
export function pathIsComplete(stageCount: number, passedCount: number) {
  return stageCount > 0 && passedCount === stageCount;
}

export type RecordedStage = {
  order: number;
  title: string;
  passed: boolean;
  when: string;
};

export function transcriptBlocks(input: {
  learnerName: string;
  skillName: string;
  passedCount: number;
  stageCount: number;
  stages: RecordedStage[];
}): string[] {
  const passed = input.stages.filter((stage) => stage.passed);
  const lines = [
    "SkillFlow transcript",
    input.learnerName,
    input.skillName,
    `${input.passedCount} of ${input.stageCount} stages passed`,
  ];
  if (passed.length === 0) {
    lines.push("No stage on this path has a passed explain-back yet.");
    return lines;
  }
  for (const stage of passed) {
    lines.push(`Stage ${stage.order}. ${stage.title}`, stage.when);
  }
  return lines;
}

export function certificateBlocks(input: {
  learnerName: string;
  skillName: string;
  issuedOn: string | null;
  stages: RecordedStage[];
}): string[] {
  return [
    "SkillFlow",
    "Certificate of completion",
    "This records that",
    input.learnerName,
    "passed every explain-back on",
    input.skillName,
    input.issuedOn ? `Issued ${input.issuedOn}` : "Issued by SkillFlow",
    "Stages",
    ...input.stages.map((stage) => `Stage ${stage.order}. ${stage.title} — ${stage.when}`),
    "Copyright SkillFlow. This record is issued by SkillFlow. It covers explain-back passes on this path. It is not a license or a degree.",
  ];
}
