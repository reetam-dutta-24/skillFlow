import Link from "next/link";
import { notFound } from "next/navigation";
import { getLesson } from "@/lib/data/lesson";
import { orderedStageResources } from "@/lib/plan/build";
import { readLearningPlan } from "@/lib/plan/store";
import type { ResourceType, ResourceView } from "@/lib/types/domain";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { LessonScreen } from "./LessonScreen";

function hostLabel(url: string) {
  if (url.startsWith("/uploads/")) return "Uploaded file";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Link";
  }
}

function kindLabel(type: ResourceType) {
  if (type === "DOC_LINK") return "Documentation";
  if (type === "COURSE_LINK") return "Course";
  if (type === "EMBEDDED_VIDEO") return "Video";
  return "Short clip";
}

function pickClip(resources: ResourceView[]) {
  return (
    resources.find((item) => item.type === "HOOK_CLIP" && !item.unavailable) ??
    resources.find((item) => item.type === "EMBEDDED_VIDEO" && !item.unavailable) ??
    null
  );
}

function pickFeatured(resources: ResourceView[], clipId: string | null) {
  return (
    resources.find(
      (item) => item.id !== clipId && item.type !== "HOOK_CLIP" && item.type !== "EMBEDDED_VIDEO" && !item.unavailable,
    ) ?? null
  );
}

function arrange(resources: ResourceView[], optionalIds: Set<string>, planned: boolean) {
  if (!planned) {
    const clip = pickClip(resources);
    const featured = pickFeatured(resources, clip?.id ?? null);
    return { clip, featured, sources: resources.filter((item) => item.id !== clip?.id && item.id !== featured?.id) };
  }
  const required = resources.filter((item) => !optionalIds.has(item.id));
  const primary = required[0] ?? resources[0] ?? null;
  const primaryIsVideo = primary != null && (primary.type === "HOOK_CLIP" || primary.type === "EMBEDDED_VIDEO");
  const clip = primaryIsVideo ? primary : null;
  const featured = primaryIsVideo
    ? resources.find((item) => item.id !== primary.id && item.type !== "HOOK_CLIP" && item.type !== "EMBEDDED_VIDEO") ?? null
    : primary;
  return { clip, featured, sources: resources.filter((item) => item.id !== clip?.id && item.id !== featured?.id) };
}

function sourceKind(item: ResourceView, optionalIds: Set<string>) {
  const kind = `${kindLabel(item.type)} · ${item.unavailable ? "Source unavailable" : hostLabel(item.url)}`;
  return optionalIds.has(item.id) ? `${kind} · Optional` : kind;
}

/** One stage. Shared resources come from the catalog cache. A saved plan reorders them on this request. */
export async function LessonView({ stageId, userId }: { stageId: string; userId: string }) {
  const data = await getLesson(stageId);
  if (!data) notFound();

  if (data.kind === "locked") {
    const hint = data.previousStageTitle ? "The last part of this free path stays locked." : "This stage is not open yet.";
    return (
      <div className="sf-lesson">
        <p>
          <Link className="sf-roadmap-link" href={`/roadmap/${data.skillSlug}`}>
            Back to the path
          </Link>
        </p>
        <EmptyState icon="lock" titleAs="h1" title={data.stageTitle} description={`${data.skillName}. ${hint}`} />
      </div>
    );
  }

  const learning = await readLearningPlan(userId, data.skill.id);
  const stagePlan = learning?.applied ? learning.plan.stages.find((stage) => stage.id === stageId) ?? null : null;
  const selected = orderedStageResources(data.resources, stagePlan);

  if (selected.resources.length === 0) {
    return (
      <div className="sf-lesson">
        <p>
          <Link className="sf-roadmap-link" href={`/roadmap/${data.skill.slug}`}>
            Back to the path
          </Link>
        </p>
        <EmptyState
          icon="book-open"
          titleAs="h1"
          title={data.stage.title}
          description={`${data.skill.name}. No resources have been added to this stage yet.`}
        />
      </div>
    );
  }

  const { clip, featured, sources } = arrange(selected.resources, selected.optionalIds, stagePlan != null);

  return (
    <div className="sf-lesson">
      <p>
        <Link className="sf-roadmap-link" href={`/roadmap/${data.skill.slug}`}>
          Back to the path
        </Link>
      </p>
      {selected.note ? <p className="sf-note-summary">{selected.note}</p> : null}
      <LessonScreen
        title={clip?.title ?? featured?.title ?? data.stage.title}
        skill={data.skill.name}
        stage={data.stage.title}
        clipUrl={clip?.url}
        poster={data.skill.image}
        resource={
          featured
            ? {
                title: featured.title,
                url: featured.url,
                source: selected.optionalIds.has(featured.id) ? `${hostLabel(featured.url)} · Optional` : hostLabel(featured.url),
              }
            : undefined
        }
        continueHref={data.stage.hasExplainBack ? `/milestone/${data.stage.id}` : undefined}
      />
      {featured && (featured.description || featured.keyPoints.length) ? (
        <section className="sf-lesson-notes" aria-label="About this resource">
          {featured.description ? <p>{featured.description}</p> : null}
          {featured.keyPoints.length ? <p>{featured.keyPoints.join(" ")}</p> : null}
        </section>
      ) : null}
      {clip && (clip.description || clip.keyPoints.length) ? (
        <section className="sf-lesson-notes" aria-label="What the clip covers">
          {clip.description ? <p>{clip.description}</p> : null}
          {clip.keyPoints.length ? <p>{clip.keyPoints.join(" ")}</p> : null}
        </section>
      ) : null}
      {sources.length > 0 ? (
        <section className="sf-dash-block" aria-labelledby="lesson-sources">
          <h2 id="lesson-sources">Sources</h2>
          <ul className="sf-sources">
            {sources.map((item) =>
              item.unavailable ? (
                <li key={item.id}>
                  <article className="sf-source">
                    <p className="sf-source-kind">{sourceKind(item, selected.optionalIds)}</p>
                    <h3>{item.title}</h3>
                    {item.description ? <p>{item.description}</p> : null}
                    {item.keyPoints.length ? <p>{item.keyPoints.join(" ")}</p> : null}
                  </article>
                </li>
              ) : (
                <li key={item.id}>
                  <a className="sf-source" href={item.url} target="_blank" rel="noreferrer">
                    <p className="sf-source-kind">{sourceKind(item, selected.optionalIds)}</p>
                    <h3>{item.title}</h3>
                    {item.description ? <p>{item.description}</p> : null}
                  </a>
                </li>
              ),
            )}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
