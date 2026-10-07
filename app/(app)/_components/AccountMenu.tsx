"use client";

import { signOut } from "next-auth/react";
import { AccentSync } from "@/components/dashboard/AccentSync.jsx";
import { UserProfileMenu } from "@/components/navigation/UserProfileMenu.jsx";
import { PublishShellRole } from "./shell-role";

export function AccountMenu({
  role,
  name,
  email,
  image,
  profileHref,
  premium,
  accent,
}: {
  role: "USER" | "ADMIN";
  name: string;
  email: string | null;
  image: string | null;
  profileHref: string;
  premium: boolean;
  /** The saved accent. Applied on every signed-in page so a new account looks the same everywhere. */
  accent: string | null;
}) {
  return (
    <>
      <PublishShellRole role={role} />
      {accent ? <AccentSync accent={accent} /> : null}
      <UserProfileMenu
        name={name}
        email={email ?? undefined}
        avatarUrl={image ?? undefined}
        items={[
          ...(premium ? [] : [{ label: "Upgrade to Premium", icon: "sparkles", href: "/upgrade" }]),
          { label: "Creator studio", icon: "video", href: "/creator" },
          { label: "Profile", icon: "user", href: profileHref },
          { label: "Settings", icon: "settings", href: "/settings" },
          { label: "Log out", icon: "log-out", danger: true },
        ]}
        onSelect={(label: string) => {
          if (label === "Log out") void signOut({ callbackUrl: "/" });
        }}
      />
    </>
  );
}
