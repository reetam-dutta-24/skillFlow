"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthShell } from "@/components/feedback/AuthShell.jsx";
import { AuthInput } from "@/components/forms/AuthInput.jsx";
import { Button } from "@/components/core/Button.jsx";
import { GoogleButton } from "@/components/forms/GoogleButton";

/** What each Auth.js error in ?error= means for the learner. */
const AUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked:
    "That Google account could not be connected. If this email already has a SkillFlow password, log in with it, then connect Google from Settings. If you were connecting from Settings, that Google account already belongs to another SkillFlow account.",
  AccessDenied: "Google did not confirm a verified email for that account, so it cannot sign in here.",
  OAuthCallbackError: "Google sign-in was cancelled or did not finish. Try again.",
  Configuration: "Sign-in is not set up correctly right now. Try again, or use your email and password.",
};

export function LoginForm({ google = false }: { google?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Read once after hydration: the page is static, so the query is not known on the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRegistered(params.get("registered") === "true");
    const code = params.get("error");
    if (code) setError(AUTH_ERRORS[code] ?? "Sign-in did not finish. Try again.");
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
      setError(
        google
          ? "Invalid email or password. If you signed up with Google, use Continue with Google."
          : "Invalid email or password.",
      );
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
      {google ? (
        <>
          <GoogleButton disabled={pending} />
          <p className="sf-auth-divider">
            <span>or with email</span>
          </p>
        </>
      ) : null}
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
        <Button type="submit" variant="gradient" size="lg" full pending={pending} pendingLabel="Logging in…">
          Log in
        </Button>
      </form>
      <p className="sf-auth-switch">
        Need an account? <a href="/signup">Get started</a>
      </p>
    </AuthShell>
  );
}
