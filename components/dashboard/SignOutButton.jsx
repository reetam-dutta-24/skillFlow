"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button type="button" className="sf-dash-signout" onClick={() => signOut({ callbackUrl: "/" })}>
      Sign out
    </button>
  );
}
