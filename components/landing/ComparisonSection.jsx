import { SectionHeader } from "../core/SectionHeader.jsx";

/** Two-column comparison. No product names besides SkillFlow. */
export function ComparisonSection({ title, typical, skillflow, rows }) {
  return (
    <section className="sf-section sf-band-base" aria-labelledby="landing-compare-title">
      <SectionHeader
        align="center"
        className="sf-section-head"
        title={title}
        titleId="landing-compare-title"
        titleSize="var(--text-section)"
      />
      <div className="sf-compare">
        <table aria-labelledby="landing-compare-title">
          <thead>
            <tr>
              <th scope="col">
                <span className="sf-compare-corner">Compared</span>
              </th>
              <th scope="col">{typical}</th>
              <th scope="col">{skillflow}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.typical}</td>
                <td>{row.skillflow}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
