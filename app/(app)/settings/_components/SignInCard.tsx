"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SettingsSection } from "@/components/forms/SettingsSection.jsx";
import { Button } from "@/components/core/Button.jsx";
import { GoogleButton } from "@/components/forms/GoogleButton";
import { disconnectGoogle } from "../actions";

export type SignInState = { hasPassword: boolean; emailVerified: boolean; google: boolean; googleAvailable: boolean };

/** How this account signs in: the email, whether Google verified it, and connecting or removing Google. Personal, per request. */
export function SignInCard({ email, signIn }: { email: string; signIn: SignInState }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Google sends the learner back to /settings?linked=google after connecting.
    if (new URLSearchParams(window.location.search).get("linked") !== "google") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotice("Google is connected. You can sign in with it from now on.");
    window.history.replaceState(null, "", "/settings");
  }, []);

  async function disconnect() {
    setPending(true);
    setNotice("");
    setError("");
    const result = await disconnectGoogle();
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNotice("Google is disconnected. Sign in with your email and password.");
    router.refresh();
  }

  const status = error || notice;

  return (
    <SettingsSection title="Sign-in" subtitle="How you get into this account.">
      <p className={status ? `sf-settings-banner${error ? " is-error" : ""}` : "sf-review-live"} aria-live="polite" role={error ? "alert" : "status"}>
        {status}
      </p>
      <div className="sf-settings-row">
        <div>
          <h3>Email</h3>
          <p>{email || "No email on this account."}</p>
        </div>
        <span className={signIn.emailVerified ? "sf-signin-chip is-ok" : "sf-signin-chip"}>
          {signIn.emailVerified ? "Verified by Google" : "Not verified"}
        </span>
      </div>
      <div className="sf-settings-row">
        <div>
          <h3>Password</h3>
          <p>{signIn.hasPassword ? "Set. You can log in with your email and password." : "None. This account signs in with Google."}</p>
        </div>
      </div>
      <div className="sf-settings-row sf-signin-google">
        <div>
          <h3>Google</h3>
          <p>
            {signIn.google
              ? "Connected. Continue with Google signs you in to this account."
              : signIn.googleAvailable
                ? signIn.emailVerified
                  ? "Not connected."
                  : "Not connected. Connecting a Google account verifies your email. If this account uses an address nobody verified, it moves to that Gmail address."
                : "Google sign-in is not set up on this server yet."}
          </p>
        </div>
        {signIn.google ? (
          signIn.hasPassword ? (
            <Button type="button" variant="outline" pending={pending} pendingLabel="Disconnecting…" onClick={() => void disconnect()}>
              Disconnect
            </Button>
          ) : null
        ) : signIn.googleAvailable ? (
          <div className="sf-signin-connect">
            <GoogleButton label="Connect Google" redirectTo="/settings?linked=google" />
          </div>
        ) : null}
      </div>
    </SettingsSection>
  );
}
