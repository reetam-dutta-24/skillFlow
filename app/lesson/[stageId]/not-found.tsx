import { RouteNotFound } from "@/components/shell/RouteNotFound";

export default function LessonNotFound() {
  return (
    <RouteNotFound
      pageTitle="Lesson"
      title="Lesson not found"
      description="This lesson doesn't exist yet."
    />
  );
}
