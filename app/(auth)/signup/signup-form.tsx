"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { signUp } from "./actions";
import { AuthShell } from "@/components/feedback/AuthShell.jsx";
import { AuthInput } from "@/components/forms/AuthInput.jsx";
import { Button } from "@/components/core/Button.jsx";
import { GoogleButton } from "@/components/forms/GoogleButton";

export function SignUpForm({ google = false }: { google?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const result = await signUp(formData);
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    const signedIn = await signIn("credentials", { email, password, redirect: false });
    if (signedIn?.error) {
      router.push("/login?registered=true");
      return;
    }
    router.push("/onboarding");
  }

  return (
    <AuthShell
      headline="Prove you understood it, not just that you watched it."
      sub="Free to start. No credit card required."
    >
      <h2>Create an account</h2>
      {google ? (
        <>
          <GoogleButton label="Sign up with Google" disabled={pending} />
          <p className="sf-auth-divider">
            <span>or with email</span>
          </p>
        </>
      ) : null}
      <form className="sf-auth-form" action={handleSubmit}>
        <label className="sf-auth-field">
          Name
          <AuthInput icon="user" name="name" type="text" autoComplete="name" required />
        </label>
        <label className="sf-auth-field">
          Email
          <AuthInput icon="mail" name="email" type="email" autoComplete="email" required />
        </label>
        <label className="sf-auth-field">
          Password
          <AuthInput icon="lock" name="password" type="password" autoComplete="new-password" required minLength={8} />
        </label>
        {error ? (
          <p className="sf-auth-error" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" variant="gradient" size="lg" full pending={pending} pendingLabel="Creating account…">
          Create account
        </Button>
      </form>
      <p className="sf-auth-switch">
        Already have an account? <a href="/login">Log in</a>
      </p>
    </AuthShell>
  );
}
