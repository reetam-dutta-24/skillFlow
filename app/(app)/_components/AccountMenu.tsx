"use client";

import { signOut } from "next-auth/react";
import { UserProfileMenu } from "@/components/navigation/UserProfileMenu.jsx";
import { PublishShellRole } from "./shell-role";

export function AccountMenu({
  role,
  name,
  email,
  image,
  profileHref,
}: {
  role: "USER" | "ADMIN";
  name: string;
  email: string | null;
  image: string | null;
  profileHref: string;
}) {
  return (
    <>
      <PublishShellRole role={role} />
      <UserProfileMenu
        name={name}
        email={email ?? undefined}
        avatarUrl={image ?? undefined}
        items={[
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
