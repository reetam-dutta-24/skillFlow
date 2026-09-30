import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { NotificationBell } from "@/components/navigation/NotificationBell.jsx";
import { getNotifications } from "@/lib/data/notifications";
import { AccountMenuFallback } from "./_components/AccountMenuFallback";
import { AppShell } from "./_components/AppShell";
import { NotificationMenu } from "./_components/NotificationMenu";
import { ShellIdentity } from "./_components/ShellIdentity";

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

async function ShellNotifications() {
  const { items } = await getNotifications();
  return <NotificationMenu items={items} />;
}

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
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
    >
      {children}
    </AppShell>
  );
}
