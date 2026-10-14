"use client";

import { useState } from "react";
import { Button } from "@/components/core/Button.jsx";
import { Icon } from "@/components/core/Icon.jsx";
import { ConfirmDialog } from "../../open-source/_components/ConfirmDialog";
import { deleteAccount } from "../actions";

const PHRASE = "DELETE";

/** Permanent account deletion, behind a typed confirmation and the password when the account has one. */
export function DangerZone({ email, hasPassword }: { email: string; hasPassword: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const ready = confirm.trim() === PHRASE && (!hasPassword || password.length > 0);

  function close() {
    if (pending) return;
    setOpen(false);
    setConfirm("");
    setPassword("");
    setError("");
  }

  async function submit() {
    if (!ready) return;
    setPending(true);
    setError("");
    // On success the action signs out and redirects, so nothing after this runs.
    const result = await deleteAccount({ confirm, password });
    setPending(false);
    if (result && !result.ok) setError(result.error);
  }

  return (
    <section className="sf-danger" aria-labelledby="danger-zone">
      <header>
        <span className="sf-danger-icon" aria-hidden="true">
          <Icon name="triangle-alert" size={18} />
        </span>
        <div>
          <h2 id="danger-zone">Danger zone</h2>
          <p>Actions here cannot be undone.</p>
        </div>
      </header>
      <div className="sf-danger-row">
        <div>
          <h3>Delete this account</h3>
          <p>
            Permanently removes {email ? <strong>{email}</strong> : "this account"} and everything personal in it. There is no recovery and no grace period.
          </p>
        </div>
        <Button type="button" variant="danger" onClick={() => setOpen(true)}>
          <Icon name="trash-2" size={16} />
          Delete account…
        </Button>
      </div>

      <ConfirmDialog open={open} title="Delete your account permanently?" onClose={close}>
        <div className="sf-danger-dialog">
          <p className="sf-danger-warning">
            <Icon name="shield-alert" size={16} />
            This cannot be undone. SkillFlow cannot restore a deleted account.
          </p>
          <div className="sf-danger-lists">
            <div>
              <h3>Deleted now</h3>
              <ul>
                <li>Your profile, display name, photo, and city</li>
                <li>Followed paths, passed stages, transcripts, and certificates</li>
                <li>Explain-back history, notes, recall answers, and plans</li>
                <li>Career-fit results and uploaded videos</li>
                <li>Premium, cancelled with Stripe straight away</li>
              </ul>
            </div>
            <div>
              <h3>Also removed</h3>
              <ul>
                <li>Your Open Source contributions, published or not, and the questions on them</li>
                <li>Questions you asked, community events you submitted, and your requests</li>
              </ul>
              <p className="sf-danger-note">Review decisions you made on other people&apos;s posts stay, without your name.</p>
            </div>
          </div>
          <label className="sf-danger-field">
            <span>
              Type <strong>{PHRASE}</strong> to confirm
            </span>
            <input value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="off" spellCheck={false} />
          </label>
          {hasPassword ? (
            <label className="sf-danger-field">
              <span>Your password</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
            </label>
          ) : null}
          {error ? (
            <p className="sf-auth-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="sf-danger-actions">
            <Button type="button" variant="ghost" disabled={pending} onClick={close}>
              Keep my account
            </Button>
            <Button type="button" variant="danger" disabled={!ready} pending={pending} pendingLabel="Deleting…" onClick={() => void submit()}>
              Delete permanently
            </Button>
          </div>
        </div>
      </ConfirmDialog>
    </section>
  );
}
