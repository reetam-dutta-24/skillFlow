"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "./actions";
import { AuthShell } from "@/components/feedback/AuthShell.jsx";
import { AuthInput } from "@/components/forms/AuthInput.jsx";
import { Button } from "@/components/core/Button.jsx";

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await signUp(formData);
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    router.push("/login?registered=true");
  }

  return (
    <AuthShell
      headline="Prove you understood it, not just that you watched it."
      sub="Free to start. No credit card required."
    >
      <h2>Create an account</h2>
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
        <Button type="submit" variant="gradient" size="lg" full disabled={pending}>
          {pending ? "Creating account" : "Create account"}
        </Button>
      </form>
      <p className="sf-auth-switch">
        Already have an account? <a href="/login">Log in</a>
      </p>
    </AuthShell>
  );
}
