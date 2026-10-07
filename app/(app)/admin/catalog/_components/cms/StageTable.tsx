"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SkillImage } from "@/components/core/SkillImage";
import { Icon } from "@/components/core/Icon.jsx";
import { Button } from "@/components/core/Button.jsx";
import { useToast } from "@/components/feedback/Toast";
import { ConfirmDialog } from "@/app/(app)/open-source/_components/ConfirmDialog";
import type { CmsNiche, CmsStage } from "@/lib/data/catalog-admin";
import { moveStages, removeStage } from "../../actions";
import { cmsHref } from "./fields";

const LEVEL = { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" } as const;

/** The path's stages as a table: open one to edit it, move it, or delete it when no learner has worked on it. */
export function StageTable({ niche }: { niche: CmsNiche }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<CmsStage | null>(null);

  async function move(stage: CmsStage, direction: -1 | 1) {
    const ids = niche.stages.map((item) => item.id);
    const index = ids.indexOf(stage.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setPending(stage.id);
    setError("");
    const result = await moveStages({ skillId: niche.id, stageIds: ids });
    setPending("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function remove(stage: CmsStage) {
    setPending(stage.id);
    setError("");
    const result = await removeStage({ id: stage.id });
    setPending("");
    setConfirm(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast(`Stage ${stage.order} deleted.`);
    router.refresh();
  }

  return (
    <section className="sf-cms-panel" aria-labelledby="cms-stages">
      <header className="sf-cms-panel-head">
        <div>
          <h2 id="cms-stages">Stages</h2>
          <p>
            {niche.stages.length} {niche.stages.length === 1 ? "stage" : "stages"} in path order. A stage a learner has worked on can be edited but not deleted.
          </p>
        </div>
        <Link className="sf-btn sf-btn--gradient sf-btn--md" href={cmsHref({ niche: niche.slug, stage: "new" })}>
          <Icon name="plus" size={15} /> Add stage
        </Link>
      </header>
      {error ? (
        <p className="sf-cms-status is-error" role="alert">
          {error}
        </p>
      ) : null}
      {niche.stages.length === 0 ? (
        <p className="sf-cms-empty">No stages yet. Add the first one; learners see stages in this order.</p>
      ) : (
        <div className="sf-cms-table-wrap">
          <table className="sf-cms-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Stage</th>
                <th scope="col">Level</th>
                <th scope="col">Resources</th>
                <th scope="col">Learners</th>
                <th scope="col">
                  <span className="sf-sr">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {niche.stages.map((stage, index) => {
                const review = stage.resources.filter((resource) => resource.needsReview).length;
                return (
                  <tr key={stage.id}>
                    <td data-label="#">{stage.order}</td>
                    <td data-label="Stage">
                      <Link className="sf-cms-stage-cell" href={cmsHref({ niche: niche.slug, stage: stage.id })}>
                        <span className="sf-cms-thumb">
                          {stage.image ? <SkillImage src={stage.image} alt="" fill sizes="64px" /> : <Icon name="image" size={16} />}
                        </span>
                        <span>
                          <strong>{stage.title}</strong>
                          {stage.question ? null : <small className="sf-cms-warn-text">No explain-back question</small>}
                        </span>
                      </Link>
                    </td>
                    <td data-label="Level">{LEVEL[stage.level]}</td>
                    <td data-label="Resources">
                      {stage.resources.length}
                      {review ? <span className="sf-cms-tag is-warn">{review} to review</span> : null}
                    </td>
                    <td data-label="Learners">{stage.learners}</td>
                    <td className="sf-cms-row-actions">
                      <button type="button" aria-label={`Move stage ${stage.order} up`} disabled={index === 0 || pending !== ""} onClick={() => void move(stage, -1)}>
                        <Icon name="chevron-up" size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move stage ${stage.order} down`}
                        disabled={index === niche.stages.length - 1 || pending !== ""}
                        onClick={() => void move(stage, 1)}
                      >
                        <Icon name="chevron-down" size={15} />
                      </button>
                      <Link aria-label={`Edit stage ${stage.order}`} href={cmsHref({ niche: niche.slug, stage: stage.id })}>
                        <Icon name="pencil" size={15} />
                      </Link>
                      <button
                        type="button"
                        aria-label={`Delete stage ${stage.order}`}
                        disabled={pending !== "" || stage.learners > 0}
                        title={stage.learners > 0 ? "Learners have worked on this stage, so it cannot be deleted." : undefined}
                        onClick={() => setConfirm(stage)}
                      >
                        <Icon name="trash-2" size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog open={confirm !== null} title={`Delete stage ${confirm?.order ?? ""}?`} onClose={() => setConfirm(null)}>
        <p>
          &ldquo;{confirm?.title}&rdquo; and its {confirm?.resources.length ?? 0} resources are deleted, and the stages after it move up one place.
        </p>
        <div className="sf-review-actions">
          <Button type="button" variant="ghost" onClick={() => setConfirm(null)}>
            Keep it
          </Button>
          <Button type="button" variant="gradient" pending={pending !== ""} pendingLabel="Deleting…" onClick={() => confirm && void remove(confirm)}>
            Delete stage
          </Button>
        </div>
      </ConfirmDialog>
    </section>
  );
}
