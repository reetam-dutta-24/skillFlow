import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getNotifications } from "@/lib/data/notifications";
import { NotificationBell } from "@/components/navigation/NotificationBell.jsx";
import { AppShell } from "./_components/AppShell";
import { NotificationMenu } from "./_components/NotificationMenu";

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

export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = session.user.role === "ADMIN" ? "ADMIN" : "USER";

  return (
    <AppShell
      user={{
        name: session.user.name?.trim() || "Account",
        email: session.user.email ?? null,
        image: session.user.image ?? null,
        role,
      }}
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
