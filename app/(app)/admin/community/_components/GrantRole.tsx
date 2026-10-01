"use client";

import { useState, useTransition, type FormEvent } from "react";
import { PersonAvatar } from "@/components/community/PersonAvatar";
import { Button } from "@/components/core/Button.jsx";
import { RoleButton } from "../../../open-source/_components/RoleButton";
import { lookupPersonAction } from "../actions";

type Person = { id: string; name: string | null; image: string | null };

/** Find one person by exact email, confirm by name and avatar, then grant a role in one niche. */
export function GrantRole({ niches }: { niches: { id: string; name: string }[] }) {
  const [email, setEmail] = useState("");
  const [person, setPerson] = useState<Person | null>(null);
  const [skillId, setSkillId] = useState(niches[0]?.id ?? "");
  const [role, setRole] = useState<"REVIEWER" | "MAINTAINER">("REVIEWER");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function find(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await lookupPersonAction(email);
      if (!result.ok) {
        setPerson(null);
        setError(result.error);
        return;
      }
      setError("");
      setPerson(result.person);
    });
  }

  return (
    <div className="sf-os-grant">
      <form className="sf-community-filters" onSubmit={find}>
        <label>
          Email address
          <input type="email" required autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={Boolean(error)} />
        </label>
        <div>
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            {pending ? "Looking…" : "Find person"}
          </Button>
        </div>
      </form>
      {error ? (
        <p className="sf-auth-error" role="alert">
          {error}
        </p>
      ) : null}
      {person ? (
        <div className="sf-os-grant-found" role="group" aria-label="Grant a role">
          <PersonAvatar name={person.name} image={person.image} size={40} />
          <div className="sf-community-filters">
            <label>
              Niche
              <select value={skillId} onChange={(event) => setSkillId(event.target.value)}>
                {niches.map((niche) => (
                  <option key={niche.id} value={niche.id}>
                    {niche.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Role
              <select value={role} onChange={(event) => setRole(event.target.value === "MAINTAINER" ? "MAINTAINER" : "REVIEWER")}>
                <option value="REVIEWER">Reviewer</option>
                <option value="MAINTAINER">Maintainer</option>
              </select>
            </label>
            <div>
              <RoleButton key={`${person.id}-${skillId}-${role}`} op="grant" userId={person.id} skillId={skillId} role={role} label={`Make ${role === "MAINTAINER" ? "maintainer" : "reviewer"}`} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
