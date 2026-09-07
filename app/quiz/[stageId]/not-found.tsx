import { RouteNotFound } from "@/components/shell/RouteNotFound";

export default function QuizNotFound() {
  return (
    <RouteNotFound
      pageTitle="Quiz"
      title="Quiz not found"
      description="This quiz doesn't exist yet."
    />
  );
}
