import { MissingPage } from "@/components/feedback/MissingPage";

export default function AppNotFound() {
  return (
    <>
      <title>Page not found | SkillFlow</title>
      <MissingPage homeHref="/dashboard" placement="content" />
    </>
  );
}
