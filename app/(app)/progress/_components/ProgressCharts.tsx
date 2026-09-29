"use client";

import { useRouter } from "next/navigation";
import { DonutChart } from "@/components/data/DonutChart.jsx";
import { LineChart } from "@/components/data/LineChart.jsx";
import { ChartPanel } from "@/components/data/ChartPanel.jsx";
import { WeakTopicList } from "@/components/data/WeakTopicList.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import type { ProgressPayload } from "@/lib/data/progress";

export function ProgressCharts({ data }: { data: ProgressPayload }) {
  const router = useRouter();
  const months = data.skills[0]?.points.map((point) => point.month) ?? [];
  const rows = months.map((month, index) => {
    const row: Record<string, string | number> = { label: month };
    for (const skill of data.skills) row[skill.skill.slug] = skill.points[index]?.value ?? 0;
    return row;
  });
  const series = data.skills.map((skill) => ({ key: skill.skill.slug, label: skill.skill.name }));

  return (
    <>
      <div className="sf-progress-donuts">
        {data.skills.map((skill) => (
          <ChartPanel key={skill.skill.id} title={skill.skill.name} subtitle="Verified mastery">
            <DonutChart value={skill.skill.masteryPercent} label={skill.skill.name} />
          </ChartPanel>
        ))}
      </div>
      <ChartPanel title="Mastery over six months" subtitle="Each line is one skill.">
        <LineChart data={rows} series={series} yMax={100} />
        <details className="sf-chart-details">
          <summary>View as table</summary>
          <table className="sf-chart-table">
            <caption>Mastery percent by month</caption>
            <thead>
              <tr>
                <th scope="col">Skill</th>
                {months.map((month) => (
                  <th key={month} scope="col">{month}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.skills.map((skill) => (
                <tr key={skill.skill.id}>
                  <th scope="row">{skill.skill.name}</th>
                  {skill.points.map((point) => (
                    <td key={point.month}>{point.value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </ChartPanel>
      <section aria-labelledby="weak-topics">
        <h2 id="weak-topics">Topics to review</h2>
        {data.weakTopics.length ? (
          <WeakTopicList
            topics={data.weakTopics.map((topic) => ({
              id: topic.id,
              topic: topic.topic,
              skill: topic.skillName,
              detail: topic.reason,
              accuracy: Math.round(topic.accuracy * 100),
              severity: topic.accuracy < 0.5 ? "high" : "medium",
            }))}
            onReview={(topic) => {
              const match = data.weakTopics.find((item) => item.id === topic.id);
              if (match) router.push(match.href);
            }}
          />
        ) : (
          <EmptyState compact icon="circle-check" title="No weak topics yet. Keep going." description="Misses and retries will show up here when a topic needs another look." />
        )}
      </section>
    </>
  );
}
