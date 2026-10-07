import Link from "next/link";
import { notFound } from "next/navigation";
import { getLesson } from "@/lib/data/lesson";
import { loadPublicCatalog } from "@/lib/data/public-catalog";
import { orderedStageResources } from "@/lib/plan/build";
import { readLearningPlan } from "@/lib/plan/store";
import type { ResourceType, ResourceView } from "@/lib/types/domain";
import { Icon } from "@/components/core/Icon.jsx";
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

function kindIcon(type: ResourceType) {
  if (type === "DOC_LINK") return "file-text";
  if (type === "COURSE_LINK") return "graduation-cap";
  return "circle-play";
}

function KeyPoints({ points }: { points: string[] }) {
  if (points.length === 0) return null;
  return (
    <ul className="sf-resource-points">
      {points.map((point) => (
        <li key={point}>{point}</li>
      ))}
    </ul>
  );
}

function ResourceCard({ item, index, optional }: { item: ResourceView; index: number; optional: boolean }) {
  return (
    <li className="sf-resource" data-unavailable={item.unavailable ? "true" : undefined}>
      <span className="sf-resource-num" aria-hidden="true">
        {index}
      </span>
      <article className="sf-resource-body">
        <p className="sf-resource-kind">
          <Icon name={kindIcon(item.type)} size={14} />
          <span>{kindLabel(item.type)}</span>
          <span aria-hidden="true">·</span>
          <span>{item.unavailable ? "Source unavailable" : hostLabel(item.url)}</span>
          {optional ? <span className="sf-resource-tag">Optional</span> : null}
        </p>
        <h3>{item.title}</h3>
        {item.description ? <p className="sf-resource-desc">{item.description}</p> : null}
        {item.keyPoints.length ? (
          <div className="sf-resource-learn">
            <p>{item.unavailable ? "What it covered" : "What you will learn"}</p>
            <KeyPoints points={item.keyPoints} />
          </div>
        ) : null}
        {item.unavailable ? null : (
          <a className="sf-btn sf-btn--outline sf-btn--sm sf-resource-open" href={item.url} target="_blank" rel="noopener noreferrer">
            Open {kindLabel(item.type).toLowerCase()}
            <Icon name="arrow-up-right" size={14} />
            <span className="sf-sr"> (opens in a new tab)</span>
          </a>
        )}
      </article>
    </li>
  );
}

function Crumbs({ slug, name, order }: { slug: string; name: string; order?: number }) {
  return (
    <nav className="sf-crumbs" aria-label="Breadcrumb">
      <Link href="/roadmap">Paths</Link>
      <span aria-hidden="true">/</span>
      <Link href={`/roadmap/${slug}`}>{name}</Link>
      {order ? (
        <>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Stage {order}</span>
        </>
      ) : null}
    </nav>
  );
}

/** One stage. Shared resources come from the catalog cache. A saved plan reorders them on this request. */
export async function LessonView({ stageId, userId }: { stageId: string; userId: string }) {
  const data = await getLesson(stageId);
  if (!data) notFound();

  if (data.kind === "locked") {
    const hint = data.sequence && data.previousStageTitle
      ? `Pass ${data.previousStageTitle} to open this stage.`
      : "This stage is not open yet.";
    return (
      <div className="sf-lessonx">
        <Crumbs slug={data.skillSlug} name={data.skillName} />
        <EmptyState
          icon="lock"
          titleAs="h1"
          title={data.stageTitle}
          description={hint}
          action={
            <Link className="sf-btn sf-btn--outline sf-btn--md" href={`/roadmap/${data.skillSlug}`}>
              Back to the path
            </Link>
          }
        />
      </div>
    );
  }

  const [learning, catalog] = await Promise.all([readLearningPlan(userId, data.skill.id), loadPublicCatalog()]);
  const total = catalog.find((entry) => entry.skill.id === data.skill.id)?.stages.length ?? 0;
  const stagePlan = learning?.applied ? learning.plan.stages.find((stage) => stage.id === stageId) ?? null : null;
  const selected = orderedStageResources(data.resources, stagePlan);

  if (selected.resources.length === 0) {
    return (
      <div className="sf-lessonx">
        <Crumbs slug={data.skill.slug} name={data.skill.name} order={data.stage.order} />
        <EmptyState
          icon="book-open"
          titleAs="h1"
          title={data.stage.title}
          description="No resources have been added to this stage yet."
          action={
            <Link className="sf-btn sf-btn--outline sf-btn--md" href={`/roadmap/${data.skill.slug}`}>
              Back to the path
            </Link>
          }
        />
      </div>
    );
  }

  const { clip, featured, sources } = arrange(selected.resources, selected.optionalIds, stagePlan != null);
  const reading = [featured, ...sources].filter((item): item is ResourceView => item != null);
  const count = selected.resources.length;

  return (
    <div className="sf-lessonx">
      <Crumbs slug={data.skill.slug} name={data.skill.name} order={data.stage.order} />
      <header className="sf-lessonx-head">
        <p className="sf-lessonx-kicker">
          {data.skill.name} · Stage {data.stage.order}
          {total ? ` of ${total}` : ""}
        </p>
        <h1>{data.stage.title}</h1>
        {data.stage.description ? <p className="sf-lessonx-lede">{data.stage.description}</p> : null}
        <p className="sf-lessonx-meta">
          {count} {count === 1 ? "resource" : "resources"}
          {data.stage.hasExplainBack ? " · Explain-back when you are ready" : ""}
        </p>
        {selected.note ? <p className="sf-note-summary">{selected.note}</p> : null}
      </header>

      <div className="sf-lessonx-grid">
        <div className="sf-lessonx-main">
          {clip ? (
            <section className="sf-lessonx-section" aria-labelledby="lesson-watch">
              <h2 id="lesson-watch">Watch first</h2>
              <LessonScreen title={clip.title} clipUrl={clip.url} poster={data.stage.image ?? data.skill.image} />
              <div className="sf-clip-info">
                <h3>{clip.title}</h3>
                <p className="sf-resource-kind">
                  <Icon name="circle-play" size={14} />
                  <span>{kindLabel(clip.type)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{hostLabel(clip.url)}</span>
                </p>
                {clip.description ? <p className="sf-resource-desc">{clip.description}</p> : null}
                <KeyPoints points={clip.keyPoints} />
              </div>
            </section>
          ) : null}

          {reading.length > 0 ? (
            <section className="sf-lessonx-section" aria-labelledby="lesson-resources">
              <h2 id="lesson-resources">{clip ? "Then read and practice" : "Resources"}</h2>
              <ol className="sf-resources">
                {reading.map((item, index) => (
                  <ResourceCard key={item.id} item={item} index={index + 1} optional={selected.optionalIds.has(item.id)} />
                ))}
              </ol>
            </section>
          ) : null}
        </div>

        <aside className="sf-lessonx-aside" aria-label="Next step">
          <div className="sf-lesson-ready">
            <Icon name="message-square-quote" size={20} />
            <h2>When you are ready</h2>
            <p>
              {data.stage.hasExplainBack
                ? "Explain each idea from this stage in your own words. A written review comes back for every idea, and the stage is recorded once each one holds."
                : "This stage has no explain-back yet. Work through the resources at your own pace."}
            </p>
            {data.stage.hasExplainBack ? (
              <Link className="sf-btn sf-btn--gradient sf-btn--lg sf-btn--full" href={`/milestone/${data.stage.id}`}>
                Explain it back
              </Link>
            ) : null}
            <Link className="sf-ready-back" href={`/roadmap/${data.skill.slug}`}>
              Back to the path
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
