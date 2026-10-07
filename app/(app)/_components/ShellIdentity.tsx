import { redirect } from "next/navigation";
import { viewerHasPremium } from "@/lib/billing/access";
import { auth } from "@/lib/auth";
import { loadCachedAccount } from "@/lib/data/account";
import { AccountMenu } from "./AccountMenu";

export async function ShellIdentity() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = session.user.role === "ADMIN" ? "ADMIN" : "USER";
  const [account, premium] = await Promise.all([loadCachedAccount(session.user.id), viewerHasPremium()]);
  const name = (account?.name ?? session.user.name)?.trim() || "Account";

  return (
    <AccountMenu
      role={role}
      name={name}
      email={account?.email ?? session.user.email ?? null}
      image={account?.image ?? session.user.image ?? null}
      profileHref={`/profile/${session.user.id}`}
      premium={premium}
    />
  );
}
