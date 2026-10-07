import type { Heatmap } from "@/lib/community-heatmap";

/**
 * GitHub-style grid of merged contributions per day. Plain elements and design tokens, no chart library.
 * The total sits above the grid, every cell carries its own label, and a hidden summary reads the year in one sentence.
 * On a phone the grid scrolls inside its own box; the page does not.
 */
/** `noun` names one counted thing: "merged contribution" on Open Source, "contribution" for all activity. */
export function ContributionHeatmap({ heatmap, headingId, noun = "merged contribution" }: { heatmap: Heatmap; headingId: string; noun?: string }) {
  const columns = heatmap.weeks.length;
  return (
    <figure className="sf-heatmap" aria-labelledby={headingId}>
      <p className="sf-heatmap-total" id={headingId}>
        {heatmap.total} {heatmap.total === 1 ? noun : `${noun}s`} in the last 12 months
      </p>
      <p className="sf-sr">{heatmap.summary}</p>
      <div className="sf-heatmap-scroll" tabIndex={0} aria-label="Contribution calendar, scrolls sideways">
        <div className="sf-heatmap-months" style={{ gridTemplateColumns: `repeat(${columns}, var(--heat-cell))` }} aria-hidden="true">
          {heatmap.months.map((month) => (
            <span key={`${month.column}-${month.label}`} style={{ gridColumn: month.column + 1 }}>
              {month.label}
            </span>
          ))}
        </div>
        <div className="sf-heatmap-grid" role="list">
          {heatmap.weeks.map((week) =>
            week.map((cell) => (
              <span key={cell.day} role="listitem" className="sf-heatmap-cell" data-level={cell.level} title={cell.label} aria-label={cell.label} />
            )),
          )}
        </div>
      </div>
      <figcaption className="sf-heatmap-legend" aria-hidden="true">
        Less
        {[0, 1, 2, 3, 4].map((level) => (
          <span key={level} className="sf-heatmap-cell" data-level={level} />
        ))}
        More
      </figcaption>
    </figure>
  );
}
