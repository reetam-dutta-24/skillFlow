import Link from "next/link";
import { notFound } from "next/navigation";
import { cacheLife, cacheTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/cache/tags";
import { loadPublicLesson } from "@/lib/data/lesson";
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

/** Lesson screen for one stage. The resources are the same for every learner. */
export async function CachedLesson({ stageId }: { stageId: string }) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const data = await loadPublicLesson(stageId);
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

  if (data.resources.length === 0) {
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

  const clip = pickClip(data.resources);
  const featured = pickFeatured(data.resources, clip?.id ?? null);
  const sources = data.resources.filter((item) => item.id !== clip?.id && item.id !== featured?.id);

  return (
    <div className="sf-lesson">
      <p>
        <Link className="sf-roadmap-link" href={`/roadmap/${data.skill.slug}`}>
          Back to the path
        </Link>
      </p>
      <LessonScreen
        title={clip?.title ?? data.stage.title}
        skill={data.skill.name}
        stage={data.stage.title}
        clipUrl={clip?.url}
        poster={data.skill.image}
        resource={featured ? { title: featured.title, url: featured.url, source: hostLabel(featured.url) } : undefined}
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
                    <p className="sf-source-kind">{kindLabel(item.type)} · Source unavailable</p>
                    <h3>{item.title}</h3>
                    {item.description ? <p>{item.description}</p> : null}
                    {item.keyPoints.length ? <p>{item.keyPoints.join(" ")}</p> : null}
                  </article>
                </li>
              ) : (
                <li key={item.id}>
                  <a className="sf-source" href={item.url} target="_blank" rel="noreferrer">
                    <p className="sf-source-kind">
                      {kindLabel(item.type)} · {hostLabel(item.url)}
                    </p>
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
