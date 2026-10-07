"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { SourceField } from "@/components/forms/SourceField";
import { useToast } from "@/components/feedback/Toast";
import { ConfirmDialog } from "@/app/(app)/open-source/_components/ConfirmDialog";
import type { CmsNiche } from "@/lib/data/catalog-admin";
import { createSkill, deleteNiche, updateNiche } from "../../actions";
import { Field, FormSection, SaveBar, cmsHref } from "./fields";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Create a niche, or edit one. The slug is set once at creation because every link to the niche uses it. */
export function NicheForm({ niche }: { niche: CmsNiche | null }) {
  const router = useRouter();
  const toast = useToast();
  const editing = Boolean(niche);
  const [name, setName] = useState(niche?.name ?? "");
  const [slug, setSlug] = useState(niche?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState(niche?.description ?? "");
  const [image, setImage] = useState(niche?.image ?? "");
  const [available, setAvailable] = useState(niche ? niche.status === "AVAILABLE" : false);
  const [flagship, setFlagship] = useState(niche?.flagship ?? false);
  const [pending, setPending] = useState<"" | "save" | "delete">("");
  const [status, setStatus] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  const [confirm, setConfirm] = useState(false);

  async function save() {
    setPending("save");
    setStatus(null);
    const result = niche
      ? await updateNiche({ id: niche.id, name, description, image, status: available ? "AVAILABLE" : "COMING_SOON", isFlagship: flagship })
      : await createSkill({ name, slug, description, image, open: available });
    setPending("");
    if (!result.ok) {
      setStatus({ tone: "error", text: result.error });
      return;
    }
    toast(niche ? "Niche saved." : "Niche created.");
    router.push(cmsHref({ niche: niche ? niche.slug : slug, tab: niche ? "details" : undefined }));
    router.refresh();
  }

  async function remove() {
    if (!niche) return;
    setPending("delete");
    const result = await deleteNiche({ id: niche.id });
    setPending("");
    setConfirm(false);
    if (!result.ok) {
      setStatus({ tone: "error", text: result.error });
      return;
    }
    toast("Niche deleted.");
    router.push(cmsHref({}));
    router.refresh();
  }

  return (
    <form
      className="sf-cms-form"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <FormSection title="Identity" description="How the niche appears on cards, in search, and in its link.">
        <Field label="Name" required>
          {(props) => (
            <input
              {...props}
              value={name}
              maxLength={80}
              required
              onChange={(event) => {
                setName(event.target.value);
                if (!editing && !slugTouched) setSlug(slugify(event.target.value));
              }}
              placeholder="Travel Vlogging"
            />
          )}
        </Field>
        <Field
          label="Slug"
          required={!editing}
          hint={editing ? "Fixed after creation: paths, lessons, and saved links use it." : "Lowercase words joined by hyphens. Used in the link: /roadmap/your-slug."}
        >
          {(props) => (
            <input
              {...props}
              value={slug}
              readOnly={editing}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value.toLowerCase());
              }}
              placeholder="travel-vlogging"
            />
          )}
        </Field>
        <Field label="Description" wide hint="One or two sentences. Shown on the niche card and the path page.">
          {(props) => <textarea {...props} rows={3} maxLength={400} value={description} onChange={(event) => setDescription(event.target.value)} />}
        </Field>
      </FormSection>

      <FormSection title="Cover photo" description="A wide photo for the card. Upload one, or paste an https link; it is copied into the site.">
        <div className="sf-cms-field is-wide">
          <SourceField label="Photo" value={image} onChange={setImage} kind="image" />
        </div>
      </FormSection>

      <FormSection title="Visibility" description="Free or Premium follows the free-path list in code and cannot be changed here.">
        <label className="sf-cms-check">
          <input type="checkbox" checked={available} onChange={(event) => setAvailable(event.target.checked)} />
          <span>
            <strong>Available</strong>
            <small>Learners can open and follow it. Off shows it as Coming soon.</small>
          </span>
        </label>
        {editing ? (
          <label className="sf-cms-check">
            <input type="checkbox" checked={flagship} onChange={(event) => setFlagship(event.target.checked)} />
            <span>
              <strong>Flagship</strong>
              <small>Featured first among the niches.</small>
            </span>
          </label>
        ) : null}
        {niche ? <p className="sf-cms-section-note">Offer: {niche.free ? "Free path" : "Premium"} · {niche.followers} followers</p> : null}
      </FormSection>

      <SaveBar status={status}>
        {niche ? (
          <Button type="button" variant="ghost" disabled={pending !== ""} onClick={() => setConfirm(true)}>
            Delete niche
          </Button>
        ) : null}
        <Link className="sf-btn sf-btn--outline sf-btn--md" href={niche ? cmsHref({ niche: niche.slug }) : cmsHref({})}>
          Cancel
        </Link>
        <Button type="submit" variant="gradient" pending={pending === "save"} pendingLabel="Saving…" disabled={pending !== ""}>
          {niche ? "Save niche" : "Create niche"}
        </Button>
      </SaveBar>

      <ConfirmDialog open={confirm} title={`Delete ${niche?.name ?? "this niche"}?`} onClose={() => setConfirm(false)}>
        <p>
          A niche can be deleted only when it is Premium and has no stages, followers, contributions, videos, or events. Otherwise set it to
          Coming soon.
        </p>
        <div className="sf-review-actions">
          <Button type="button" variant="ghost" onClick={() => setConfirm(false)}>
            Keep it
          </Button>
          <Button type="button" variant="gradient" pending={pending === "delete"} pendingLabel="Deleting…" onClick={() => void remove()}>
            Delete
          </Button>
        </div>
      </ConfirmDialog>
    </form>
  );
}
