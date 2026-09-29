import "server-only";
import { devDelay } from "@/lib/mock/delay";
import { listSkills, listStages, listSubmissions } from "@/lib/mock/catalog";
import type { SubmissionView } from "@/lib/types/domain";

export async function getSubmitCatalog() {
  await devDelay();
  return listSkills()
    .filter((skill) => skill.status !== "coming_soon")
    .map((skill) => ({
      id: skill.id,
      name: skill.name,
      stages: listStages(skill.id).map((stage) => ({ id: stage.id, title: stage.title })),
    }));
}

export async function getOwnSubmissions(viewer: { id: string; name: string | null }): Promise<SubmissionView[]> {
  await devDelay();
  return listSubmissions(viewer);
}
