import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true },
  });

  return (
    <AppShell
      user={{
        name: (account?.name ?? session.user.name)?.trim() || "Account",
        email: account?.email ?? session.user.email ?? null,
        image: account?.image ?? session.user.image ?? null,
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
