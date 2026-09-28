"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthShell } from "@/components/feedback/AuthShell.jsx";
import { AuthInput } from "@/components/forms/AuthInput.jsx";
import { Button } from "@/components/core/Button.jsx";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    setRegistered(new URLSearchParams(window.location.search).get("registered") === "true");
  }, []);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setPending(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <AuthShell
      headline="Prove you understood it, not just that you watched it."
      sub="Free to start. No credit card required."
    >
      <h2>Log in</h2>
      {registered ? <p className="sf-auth-note">Account created. Log in to continue.</p> : null}
      <form className="sf-auth-form" action={handleSubmit}>
        <label className="sf-auth-field">
          Email
          <AuthInput icon="mail" name="email" type="email" autoComplete="email" required />
        </label>
        <label className="sf-auth-field">
          Password
          <AuthInput icon="lock" name="password" type="password" autoComplete="current-password" required />
        </label>
        {error ? (
          <p className="sf-auth-error" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" variant="gradient" size="lg" full disabled={pending}>
          {pending ? "Logging in" : "Log in"}
        </Button>
      </form>
      <p className="sf-auth-switch">
        Need an account? <a href="/signup">Get started</a>
      </p>
    </AuthShell>
  );
}
