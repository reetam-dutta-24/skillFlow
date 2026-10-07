"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/core/Icon.jsx";
import { Button } from "@/components/core/Button.jsx";
import { useToast } from "@/components/feedback/Toast";
import { ConfirmDialog } from "@/app/(app)/open-source/_components/ConfirmDialog";
import type { CatalogEditorResource, CmsNiche, CmsStage } from "@/lib/data/catalog-admin";
import { markReviewed, moveResources, recheckLink, removeResource } from "../../actions";
import { cmsHref } from "./fields";

export const RESOURCE_TYPES = [
  { value: "EMBEDDED_VIDEO", label: "Video", icon: "circle-play" },
  { value: "HOOK_CLIP", label: "Short clip", icon: "clapperboard" },
  { value: "DOC_LINK", label: "Documentation", icon: "file-text" },
  { value: "COURSE_LINK", label: "Course", icon: "graduation-cap" },
] as const;

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** A stage's resources in lesson order, with every action an editor needs on one row. */
export function ResourceTable({ niche, stage }: { niche: CmsNiche; stage: CmsStage }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState("");
  const [message, setMessage] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  const [confirm, setConfirm] = useState<CatalogEditorResource | null>(null);
  const [reviewOnly, setReviewOnly] = useState(false);
  const rows = reviewOnly ? stage.resources.filter((resource) => resource.needsReview) : stage.resources;

  async function run(key: string, action: () => Promise<{ ok: boolean; error?: string; summary?: string }>, done: string) {
    setPending(key);
    setMessage(null);
    const result = await action();
    setPending("");
    if (!result.ok) {
      setMessage({ tone: "error", text: result.error ?? "That did not work. Try again." });
      return;
    }
    if (result.summary) setMessage({ tone: "ok", text: result.summary });
    else toast(done);
    router.refresh();
  }

  function move(resource: CatalogEditorResource, direction: -1 | 1) {
    const ids = stage.resources.map((item) => item.id);
    const index = ids.indexOf(resource.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    void run(resource.id, () => moveResources({ stageId: stage.id, resourceIds: ids }), "Order saved.");
  }

  return (
    <section className="sf-cms-panel" aria-labelledby="cms-resources">
      <header className="sf-cms-panel-head">
        <div>
          <h2 id="cms-resources">Resources</h2>
          <p>Shown in this order in the lesson. The first video is the stage&apos;s clip.</p>
        </div>
        <div className="sf-cms-head-actions">
          <label className="sf-cms-check is-inline">
            <input type="checkbox" checked={reviewOnly} onChange={(event) => setReviewOnly(event.target.checked)} />
            <span>Needs review only</span>
          </label>
          <Link className="sf-btn sf-btn--gradient sf-btn--md" href={cmsHref({ niche: niche.slug, stage: stage.id, resource: "new" })}>
            <Icon name="plus" size={15} /> Add resource
          </Link>
        </div>
      </header>
      {message ? (
        <p className={message.tone === "error" ? "sf-cms-status is-error" : "sf-cms-status"} role={message.tone === "error" ? "alert" : "status"}>
          {message.text}
        </p>
      ) : null}
      {rows.length === 0 ? (
        <p className="sf-cms-empty">{reviewOnly ? "Nothing on this stage needs review." : "No resources yet. Add a video, an article, or a course."}</p>
      ) : (
        <ul className="sf-cms-resources">
          {rows.map((resource) => {
            const type = RESOURCE_TYPES.find((item) => item.value === resource.type);
            const index = stage.resources.indexOf(resource);
            return (
              <li key={resource.id} className="sf-cms-resource">
                <span className="sf-cms-resource-icon" aria-hidden="true">
                  <Icon name={type?.icon ?? "link"} size={16} />
                </span>
                <Link className="sf-cms-resource-main" href={cmsHref({ niche: niche.slug, stage: stage.id, resource: resource.id })}>
                  <strong>{resource.title}</strong>
                  <span>
                    {type?.label ?? resource.type} · {host(resource.url)}
                    {resource.isCore ? " · core" : ""}
                  </span>
                </Link>
                <span className="sf-cms-resource-tags">
                  {resource.needsReview ? <span className="sf-cms-tag is-warn">Needs review</span> : null}
                  {resource.sourceStatus === "UNAVAILABLE" ? <span className="sf-cms-tag is-bad">Unavailable</span> : null}
                </span>
                <span className="sf-cms-row-actions">
                  <button type="button" aria-label={`Move ${resource.title} up`} disabled={index === 0 || pending !== ""} onClick={() => move(resource, -1)}>
                    <Icon name="chevron-up" size={15} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${resource.title} down`}
                    disabled={index === stage.resources.length - 1 || pending !== ""}
                    onClick={() => move(resource, 1)}
                  >
                    <Icon name="chevron-down" size={15} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Re-check the link for ${resource.title}`}
                    title="Re-check link"
                    disabled={pending !== ""}
                    onClick={() => void run(resource.id, () => recheckLink({ id: resource.id, stageId: stage.id }), "Link checked.")}
                  >
                    <Icon name="refresh-cw" size={15} />
                  </button>
                  {resource.needsReview ? (
                    <button
                      type="button"
                      aria-label={`Mark ${resource.title} reviewed`}
                      title="Mark reviewed"
                      disabled={pending !== ""}
                      onClick={() => void run(resource.id, () => markReviewed({ id: resource.id, stageId: stage.id }), "Marked reviewed.")}
                    >
                      <Icon name="check" size={15} />
                    </button>
                  ) : null}
                  <Link aria-label={`Edit ${resource.title}`} href={cmsHref({ niche: niche.slug, stage: stage.id, resource: resource.id })}>
                    <Icon name="pencil" size={15} />
                  </Link>
                  <button type="button" aria-label={`Delete ${resource.title}`} disabled={pending !== ""} onClick={() => setConfirm(resource)}>
                    <Icon name="trash-2" size={15} />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmDialog open={confirm !== null} title="Delete this resource?" onClose={() => setConfirm(null)}>
        <p>&ldquo;{confirm?.title}&rdquo; is removed from the lesson. Learners&apos; passes on this stage are kept.</p>
        <div className="sf-review-actions">
          <Button type="button" variant="ghost" onClick={() => setConfirm(null)}>
            Keep it
          </Button>
          <Button
            type="button"
            variant="gradient"
            pending={pending !== ""}
            pendingLabel="Deleting…"
            onClick={() => {
              const target = confirm;
              setConfirm(null);
              if (target) void run(target.id, () => removeResource({ id: target.id, stageId: stage.id }), "Resource deleted.");
            }}
          >
            Delete resource
          </Button>
        </div>
      </ConfirmDialog>
    </section>
  );
}
