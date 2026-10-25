"use client";

import { useState } from "react";
import Link from "next/link";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import { Icon } from "@/components/core/Icon.jsx";
import type { AssistantSource, SourceKind } from "@/lib/assistant/protocol";
import type { AssistantTurn } from "./Assistant";

type AnswerTurn = Extract<AssistantTurn, { role: "assistant" }>;

const KIND_ICON: Record<SourceKind, string> = {
  help: "circle-help",
  skill: "library",
  stage: "flag",
  resource: "file-text",
  video: "circle-play",
  learner: "user",
};

const KIND_LABEL: Record<SourceKind, string> = {
  help: "Help",
  skill: "Niche",
  stage: "Stage",
  resource: "Resource",
  video: "Video",
  learner: "You",
};

/** `[2]` becomes a link to `#cite-2`, which the renderer turns into a numbered chip. Real links are left alone. */
function withCiteLinks(text: string) {
  return text.replace(/\[(\d{1,3})\](?!\()/g, "[$1](#cite-$1)");
}

/**
 * One answer. While it streams it is plain text (nothing is clickable before the server has checked it); once the
 * final, verified text arrives it renders as markdown with numbered source chips and the source list underneath.
 */
export function AssistantAnswer({ turn, reduce }: { turn: AnswerTurn; reduce: boolean }) {
  const [flash, setFlash] = useState<number | null>(null);
  const sourceId = (n: number) => `${turn.id}-src-${n}`;

  function openSource(n: number) {
    const item = document.getElementById(sourceId(n));
    if (!item) return;
    item.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
    item.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
    setFlash(n);
    window.setTimeout(() => setFlash((value) => (value === n ? null : value)), 1600);
  }

  if (turn.status === "streaming") {
    return (
      <div className="sf-assist-body" aria-busy="true">
        {turn.text ? <p className="sf-assist-stream">{turn.text}</p> : <p className="sf-assist-thinking">Looking through SkillFlow…</p>}
        <span className="sf-assist-cursor" data-still={reduce ? "true" : undefined} aria-hidden="true" />
      </div>
    );
  }

  const byNumber = new Map(turn.sources.map((source) => [source.n, source]));
  const components: Components = {
    img: () => null,
    a: ({ href, children }) => {
      const cite = href?.startsWith("#cite-") ? Number(href.slice(6)) : null;
      if (cite !== null) {
        const source = byNumber.get(cite);
        if (!source) return null;
        return (
          <button type="button" className="sf-assist-cite" onClick={() => openSource(cite)} aria-label={`Source ${cite}: ${source.title}`}>
            {cite}
          </button>
        );
      }
      if (href?.startsWith("/")) return <Link href={href}>{children}</Link>;
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
  };

  return (
    <div className="sf-assist-body">
      {turn.status === "stopped" ? (
        <>
          {turn.text ? <p className="sf-assist-stream">{turn.text}</p> : null}
          <p className="sf-assist-note">Stopped. Unchecked text keeps no links or citations.</p>
        </>
      ) : (
        <div className="sf-assist-md">
          <ReactMarkdown components={components}>{withCiteLinks(turn.text)}</ReactMarkdown>
        </div>
      )}
      {turn.status === "done" && turn.sources.length ? <SourceList sources={turn.sources} idFor={sourceId} flash={flash} /> : null}
    </div>
  );
}

function SourceList({ sources, idFor, flash }: { sources: AssistantSource[]; idFor: (n: number) => string; flash: number | null }) {
  return (
    <div className="sf-assist-sources">
      <p className="sf-assist-sources-title">Sources</p>
      <ol>
        {sources.map((source) => (
          <li key={source.n} id={idFor(source.n)} data-flash={flash === source.n ? "true" : undefined}>
            <span className="sf-assist-source-n" aria-hidden="true">
              {source.n}
            </span>
            <span className="sf-assist-source-icon" data-kind={source.kind} aria-hidden="true">
              <Icon name={KIND_ICON[source.kind]} size={14} />
            </span>
            <span className="sf-assist-source-text">
              <Link href={source.href} className="sf-assist-source-link">
                {source.title}
              </Link>
              <span className="sf-assist-source-detail">
                <span className="sf-sr">{KIND_LABEL[source.kind]}: </span>
                {source.detail}
              </span>
            </span>
            {source.external ? (
              <a className="sf-assist-source-ext sf-hit" href={source.external} target="_blank" rel="noopener noreferrer">
                <Icon name="external-link" size={14} />
                <span className="sf-sr">Open the original in a new tab</span>
              </a>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
