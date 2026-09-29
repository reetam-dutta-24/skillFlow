import "server-only";
import { devDelay } from "@/lib/mock/delay";
import {
  explainOutcomes,
  habitWeek,
  learnerStats,
  listMasteryHistory,
  listSkills,
  listWeakTopics,
  quizOutcomes,
} from "@/lib/mock/catalog";

export type AnalyticsPoint = { month: string; fullStack: number; art: number };

export type AnalyticsData = {
  streak: number;
  longest: number;
  skills: { name: string; mastery: number }[];
  history: AnalyticsPoint[];
  week: { day: string; checks: number }[];
  quizzes: { name: string; count: number }[];
  explain: { name: string; count: number }[];
  insights: { title: string; body: string }[];
  reviewHref: string | null;
};

export async function getAnalytics(): Promise<AnalyticsData> {
  await devDelay();
  const skills = listSkills()
    .filter((skill) => skill.followed)
    .map((skill) => ({ name: skill.name, mastery: skill.masteryPercent }));
  const historyRows = listMasteryHistory();
  const fullStack = historyRows.find((row) => row.skillSlug === "full-stack-web-dev");
  const art = historyRows.find((row) => row.skillSlug === "art-painting");
  const history = (fullStack?.points ?? []).map((point, index) => ({
    month: point.month,
    fullStack: point.value,
    art: art?.points[index]?.value ?? 0,
  }));
  const week = habitWeek.map((day) => ({ ...day }));
  const busiest = [...week].sort((a, b) => b.checks - a.checks)[0];
  const quiet = [...week].sort((a, b) => a.checks - b.checks)[0];
  const leader = [...skills].sort((a, b) => b.mastery - a.mastery)[0];
  const trailer = [...skills].sort((a, b) => a.mastery - b.mastery)[0];
  const weak = listWeakTopics().sort((a, b) => a.accuracy - b.accuracy)[0];
  const last = history[history.length - 1];
  const first = history[0];
  const gained = last && first ? last.fullStack - first.fullStack : 0;

  return {
    streak: learnerStats.currentStreak,
    longest: learnerStats.longestStreak,
    skills,
    history,
    week,
    quizzes: [
      { name: "Passed", count: quizOutcomes.passed },
      { name: "Needs another look", count: quizOutcomes.needsAnotherLook },
    ],
    explain: [
      { name: "Passed", count: explainOutcomes.passed },
      { name: "Tried again", count: explainOutcomes.retried },
    ],
    insights: [
      {
        title: busiest && quiet ? `${busiest.day} is your busy day` : "This week",
        body: quiet?.checks === 0
          ? `You checked in ${busiest?.checks ?? 0} times on ${busiest?.day}. ${quiet.day} had none. A short session that day would keep the streak even.`
          : `Most check-ins landed on ${busiest?.day}.`,
      },
      {
        title: leader ? `${leader.name.split(" ")[0]} is ahead` : "Skills",
        body: leader && trailer
          ? `${leader.name} is at ${leader.mastery}%. ${trailer.name} is at ${trailer.mastery}%. The gap is verified mastery, not time watched.`
          : "Follow a skill to see how mastery splits.",
      },
      {
        title: gained > 0 ? `Full-Stack rose ${gained} points since April` : "Growth",
        body: `The current streak is ${learnerStats.currentStreak} days. The longest was ${learnerStats.longestStreak}. ${weak ? `${weak.topic} is the topic to review: ${weak.reason}.` : "No weak topic is flagged."}`,
      },
    ],
    reviewHref: weak ? `/lesson/${weak.stageId}` : null,
  };
}
