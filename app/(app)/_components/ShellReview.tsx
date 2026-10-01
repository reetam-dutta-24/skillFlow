import { auth } from "@/lib/auth";
import { myOpenReviewCount } from "@/lib/data/community-review";
import { PublishShellReview } from "./shell-role";

/** Per person, on the request. Reviewers and admins get the Review link with a count of open items. */
export async function ShellReview() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const count = await myOpenReviewCount(session.user.id);
  return <PublishShellReview count={count} />;
}
