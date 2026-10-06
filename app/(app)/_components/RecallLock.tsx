import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { RECALL_HOLD_COOKIE } from "@/lib/explain/recall";
import { findDueRecall } from "@/lib/explain/recall-store";
import { RecallGate } from "./RecallGate";

/** Personal. A session cookie hides the next idea until the browser is closed. */
export async function RecallLock() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const jar = await cookies();
  if (jar.get(RECALL_HOLD_COOKIE)?.value) return <RecallGate prompt={null} />;
  const due = await findDueRecall(userId);
  return <RecallGate prompt={due} />;
}
