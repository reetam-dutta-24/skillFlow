"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LeaderboardRowView } from "@/lib/types/domain";

export function LeaderboardBoard({ rows, scope }: { rows: LeaderboardRowView[]; scope: "global" | "country" | "city" }) {
  const router = useRouter();
  const [optedOut, setOptedOut] = useState(false);
  const visible = scope === "city" ? rows.filter((row) => row.city || row.isViewer) : rows;
  return (
    <div className="sf-board">
      <div role="tablist" aria-label="Leaderboard scope">
        {(["global", "country", "city"] as const).map((tab) => (
          <button key={tab} type="button" role="tab" aria-selected={scope === tab} onClick={() => router.push(tab === "global" ? "/leaderboard" : `/leaderboard?tab=${tab}`)}>
            {tab === "global" ? "Global" : tab === "country" ? "Country" : "City"}
          </button>
        ))}
      </div>
      <label className="sf-board-opt">
        <input type="checkbox" checked={optedOut} onChange={(event) => setOptedOut(event.target.checked)} />
        Hide me from the board
      </label>
      <ol>
        {visible.map((row) => (
          <li key={row.rank} className={row.isViewer ? "is-viewer" : undefined}>
            <span>{row.rank}</span>
            <strong>{optedOut && row.isViewer ? "Hidden" : row.name}</strong>
            <em>{row.city ?? "City not set"}</em>
            <span>{row.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
