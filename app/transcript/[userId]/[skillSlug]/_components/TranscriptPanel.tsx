"use client";

import { useState } from "react";

export function TranscriptPanel() {
  const [notice, setNotice] = useState("");
  return (
    <div className="sf-transcript-tools">
      <label><input type="checkbox" /> Keep this page private</label>
      <button type="button" onClick={() => { void navigator.clipboard.writeText(window.location.href); setNotice("Link copied."); }}>Copy link</button>
      <button type="button" onClick={() => setNotice("A PDF download would start here.")}>Download PDF</button>
      {notice ? <p role="status">{notice}</p> : null}
    </div>
  );
}
