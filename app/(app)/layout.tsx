import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { NotificationBell } from "@/components/navigation/NotificationBell.jsx";
import { viewerHasPremium } from "@/lib/billing/access";
import { getNotifications } from "@/lib/data/notifications";
import { AccountMenuFallback } from "./_components/AccountMenuFallback";
import { AppShell } from "./_components/AppShell";
import { NotificationMenu } from "./_components/NotificationMenu";
import { PremiumAccessProvider, PublishPremiumAccess } from "./_components/premium-access";
import { RecallLock } from "./_components/RecallLock";
import { ShellIdentity } from "./_components/ShellIdentity";
import { ShellReview } from "./_components/ShellReview";

export const metadata: Metadata = {
  title: {
    default: "SkillFlow",
    template: "%s | SkillFlow",
  },
  robots: {
    index: false,
    follow: false,
  },
};

/** Reads the session, so it streams inside Suspense. The layout itself never waits on request data. */
async function ShellPremium() {
  return <PublishPremiumAccess premium={await viewerHasPremium()} />;
}

async function ShellNotifications() {
  const { items } = await getNotifications();
  return <NotificationMenu items={items} />;
}

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <PremiumAccessProvider>
      <Suspense fallback={null}>
        <ShellPremium />
      </Suspense>
      <Suspense fallback={null}>
        <RecallLock />
      </Suspense>
      <AppShell
      account={
        <Suspense fallback={<AccountMenuFallback />}>
          <ShellIdentity />
        </Suspense>
      }
      notifications={
        <Suspense fallback={<NotificationBell count={0} />}>
          <ShellNotifications />
        </Suspense>
      }
      review={
        <Suspense fallback={null}>
          <ShellReview />
        </Suspense>
      }
    >
        {children}
      </AppShell>
    </PremiumAccessProvider>
  );
}
