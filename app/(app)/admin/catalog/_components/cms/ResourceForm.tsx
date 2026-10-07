"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { SourceField } from "@/components/forms/SourceField";
import { useToast } from "@/components/feedback/Toast";
import type { CatalogEditorResource, CmsNiche, CmsStage } from "@/lib/data/catalog-admin";
import { saveResource, suggestTags } from "../../actions";
import { Field, FormSection, LinesField, SaveBar, cmsHref } from "./fields";
import { RESOURCE_TYPES } from "./ResourceTable";

const DEPTHS = [
  { value: "", label: "Not set" },
  { value: "INTRO", label: "Intro" },
  { value: "STANDARD", label: "Standard" },
  { value: "DEEP", label: "Deep" },
] as const;

function youtubeId(url: string) {
  try {
    const parsed = new URL(url);
    const hostName = parsed.hostname.replace(/^www\./, "");
    if (hostName === "youtu.be") return parsed.pathname.slice(1).split("/")[0] ?? "";
    if (hostName.endsWith("youtube.com")) {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v") ?? "";
      const parts = parsed.pathname.split("/");
      if (parts[1] === "shorts" || parts[1] === "embed") return parts[2] ?? "";
    }
  } catch {
    return "";
  }
  return "";
}

/** Create or edit one resource. Five sections, in the order an editor fills them. */
export function ResourceForm({ niche, stage, resource }: { niche: CmsNiche; stage: CmsStage; resource: CatalogEditorResource | null }) {
  const router = useRouter();
  const toast = useToast();
  const [type, setType] = useState<string>(resource?.type ?? "EMBEDDED_VIDEO");
  const [url, setUrl] = useState(resource?.url ?? "");
  const [title, setTitle] = useState(resource?.title ?? "");
  const [description, setDescription] = useState(resource?.description ?? "");
  const [keyPoints, setKeyPoints] = useState(resource?.keyPoints ?? "");
  const [transcript, setTranscript] = useState(resource?.transcript ?? "");
  const [provider, setProvider] = useState(resource?.provider ?? "");
  const [author, setAuthor] = useState(resource?.author ?? "");
  const [videoId, setVideoId] = useState(resource?.videoId ?? "");
  const [isFree, setIsFree] = useState(resource?.isFree ?? true);
  const [language, setLanguage] = useState(resource?.language ?? "en");
  const [available, setAvailable] = useState((resource?.sourceStatus ?? "ACTIVE") === "ACTIVE");
  const [needsReview, setNeedsReview] = useState(resource?.needsReview ?? false);
  const [duration, setDuration] = useState(resource?.durationMinutes ? String(resource.durationMinutes) : "");
  const [depth, setDepth] = useState<string>(resource?.depth ?? "");
  const [isCore, setIsCore] = useState(resource?.isCore ?? false);
  const [captions, setCaptions] = useState(resource?.captionLanguages ?? "");
  const [pending, setPending] = useState<"" | "save" | "suggest">("");
  const [status, setStatus] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  const video = type === "EMBEDDED_VIDEO" || type === "HOOK_CLIP";
  const origins = resource?.tagOrigins ?? {};

  async function save() {
    setPending("save");
    setStatus(null);
    const minutes = duration.trim() ? Number(duration) : null;
    if (minutes !== null && (!Number.isInteger(minutes) || minutes < 1 || minutes > 600)) {
      setPending("");
      setStatus({ tone: "error", text: "Duration is a whole number of minutes between 1 and 600." });
      return;
    }
    const lines = (text: string) =>
      text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    const result = await saveResource({
      id: resource?.id,
      stageId: stage.id,
      type,
      url,
      title,
      description,
      keyPoints: lines(keyPoints).join("\n"),
      transcript,
      provider,
      author,
      videoId: video ? videoId || youtubeId(url) : videoId,
      isFree,
      language,
      sourceStatus: available ? "ACTIVE" : "UNAVAILABLE",
      needsReview,
      durationMinutes: minutes,
      depth: depth ? (depth as "INTRO" | "STANDARD" | "DEEP") : null,
      isCore,
      captionLanguages: lines(captions),
    });
    setPending("");
    if (!result.ok) {
      setStatus({ tone: "error", text: result.error });
      return;
    }
    toast(resource ? "Resource saved." : "Resource added.");
    router.push(cmsHref({ niche: niche.slug, stage: stage.id }));
    router.refresh();
  }

  async function suggest() {
    if (!resource) return;
    setPending("suggest");
    setStatus(null);
    const result = await suggestTags(resource.id);
    setPending("");
    if (!result.ok) {
      setStatus({ tone: "error", text: result.error });
      return;
    }
    const next = result.suggestion;
    if (origins.durationMinutes !== "admin" && next.durationMinutes) setDuration(String(next.durationMinutes));
    if (origins.depth !== "admin") setDepth(next.depth);
    if (origins.isCore !== "admin") setIsCore(next.isCore);
    if (origins.captionLanguages !== "admin" && next.captionLanguages.length) setCaptions(next.captionLanguages.join("\n"));
    setStatus({ tone: "ok", text: "Suggestions filled in. Fields you set yourself stay as they are. Review, then save." });
  }

  return (
    <form
      className="sf-cms-form"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <FormSection title="Link" description="What it is and where it lives.">
        <Field label="Type" required>
          {(props) => (
            <select {...props} value={type} onChange={(event) => setType(event.target.value)}>
              {RESOURCE_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Title" required>
          {(props) => <input {...props} value={title} required maxLength={200} onChange={(event) => setTitle(event.target.value)} placeholder="How the web works" />}
        </Field>
        <div className="sf-cms-field is-wide">
          <SourceField label="URL" value={url} onChange={setUrl} kind="any" />
          <p className="sf-cms-hint">An https link, or a file uploaded from your device. A YouTube link plays inside the lesson.</p>
        </div>
      </FormSection>

      <FormSection title="About" description="The snapshot kept with the link, so the lesson still says what it covered if the page goes away.">
        <Field label="Description" wide hint="One or two sentences shown on the resource card.">
          {(props) => <textarea {...props} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />}
        </Field>
        <LinesField label="Key point" hint="Shown as 'What you will learn'. One point per line." value={keyPoints} onChange={setKeyPoints} placeholder="The browser asks a server for a page" addLabel="Add key point" />
        <details className="sf-cms-more">
          <summary>Transcript (optional)</summary>
          <Field label="Transcript" wide hint="Used to write the explain-back ideas when the page itself cannot be read.">
            {(props) => <textarea {...props} rows={6} value={transcript} onChange={(event) => setTranscript(event.target.value)} />}
          </Field>
        </details>
      </FormSection>

      <FormSection title="Source">
        <Field label="Provider" hint="The site or channel, such as MDN or freeCodeCamp.">
          {(props) => <input {...props} value={provider} onChange={(event) => setProvider(event.target.value)} />}
        </Field>
        <Field label="Author">
          {(props) => <input {...props} value={author} onChange={(event) => setAuthor(event.target.value)} />}
        </Field>
        {video ? (
          <Field label="YouTube video ID" hint={`Filled from the link when left empty${youtubeId(url) ? `: ${youtubeId(url)}` : ""}.`}>
            {(props) => <input {...props} value={videoId} onChange={(event) => setVideoId(event.target.value)} />}
          </Field>
        ) : null}
        <Field label="Language" hint="A language code, such as en or hi.">
          {(props) => <input {...props} value={language} maxLength={16} onChange={(event) => setLanguage(event.target.value)} />}
        </Field>
        <label className="sf-cms-check">
          <input type="checkbox" checked={isFree} onChange={(event) => setIsFree(event.target.checked)} />
          <span>
            <strong>Free to access</strong>
            <small>No payment or sign-up needed to read or watch it.</small>
          </span>
        </label>
      </FormSection>

      <FormSection title="Plan tags" description="Optional. Personal plans use these to order resources and mark extras Optional.">
        <Field label="Duration (minutes)">
          {(props) => <input {...props} type="number" min={1} max={600} inputMode="numeric" value={duration} onChange={(event) => setDuration(event.target.value)} />}
        </Field>
        <Field label="Depth">
          {(props) => (
            <select {...props} value={depth} onChange={(event) => setDepth(event.target.value)}>
              {DEPTHS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <label className="sf-cms-check">
          <input type="checkbox" checked={isCore} onChange={(event) => setIsCore(event.target.checked)} />
          <span>
            <strong>Core resource</strong>
            <small>Kept even when a short deadline trims the stage.</small>
          </span>
        </label>
        <LinesField label="Caption language" value={captions} onChange={setCaptions} placeholder="en" addLabel="Add caption language" />
        {resource ? (
          <div className="sf-cms-field is-wide">
            <Button type="button" variant="outline" size="sm" pending={pending === "suggest"} pendingLabel="Asking…" disabled={pending !== ""} onClick={() => void suggest()}>
              Suggest tags with AI
            </Button>
          </div>
        ) : null}
      </FormSection>

      <FormSection title="Status">
        <label className="sf-cms-check">
          <input type="checkbox" checked={available} onChange={(event) => setAvailable(event.target.checked)} />
          <span>
            <strong>Link works</strong>
            <small>Off marks it Unavailable; the lesson keeps the saved title and key points.</small>
          </span>
        </label>
        <label className="sf-cms-check">
          <input type="checkbox" checked={needsReview} onChange={(event) => setNeedsReview(event.target.checked)} />
          <span>
            <strong>Needs review</strong>
            <small>Flags it in the CMS until someone checks it.</small>
          </span>
        </label>
        {resource?.lastVerifiedAt ? <p className="sf-cms-section-note">Link last checked {new Date(resource.lastVerifiedAt).toLocaleString()}.</p> : null}
      </FormSection>

      <SaveBar status={status}>
        <Link className="sf-btn sf-btn--outline sf-btn--md" href={cmsHref({ niche: niche.slug, stage: stage.id })}>
          Cancel
        </Link>
        <Button type="submit" variant="gradient" pending={pending === "save"} pendingLabel="Saving…" disabled={pending !== ""}>
          {resource ? "Save resource" : "Add resource"}
        </Button>
      </SaveBar>
    </form>
  );
}
