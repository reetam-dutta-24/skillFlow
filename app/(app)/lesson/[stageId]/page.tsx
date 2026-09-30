import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLesson } from "@/lib/data/lesson";
import type { ResourceType, ResourceView } from "@/lib/types/domain";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { LessonScreen } from "./_components/LessonScreen";

type PageProps = {
  params: Promise<{ stageId: string }>;
};

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { stageId } = await params;
  const data = await getLesson(stageId);
  if (!data) return { title: "Page not found" };
  return { title: data.kind === "locked" ? data.stageTitle : data.stage.title };
}

export default async function LessonPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { stageId } = await params;
  const data = await getLesson(stageId);
  if (!data) notFound();

  if (data.kind === "locked") {
    const hint = data.previousStageTitle
      ? `Complete the explain-back check on ${data.previousStageTitle} to unlock.`
      : "This stage is not open yet.";
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
  const poster = data.skill.image;

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
        poster={poster}
        resource={featured ? { title: featured.title, url: featured.url, source: hostLabel(featured.url) } : undefined}
        continueHref={data.quizHref ?? undefined}
      />
      {featured && (featured.description || featured.keyPoints) ? (
        <section className="sf-lesson-notes" aria-label="About this resource">
          {featured.description ? <p>{featured.description}</p> : null}
          {featured.keyPoints ? <p>{featured.keyPoints}</p> : null}
        </section>
      ) : null}
      {clip && (clip.description || clip.keyPoints) ? (
        <section className="sf-lesson-notes" aria-label="What the clip covers">
          {clip.description ? <p>{clip.description}</p> : null}
          {clip.keyPoints ? <p>{clip.keyPoints}</p> : null}
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
                    {item.keyPoints ? <p>{item.keyPoints}</p> : null}
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
