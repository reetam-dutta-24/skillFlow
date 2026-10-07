import { Suspense, type ReactNode } from "react";
import { FollowedSkillSeed } from "./FollowedSkillSeed";
import { FollowedOverrideProvider } from "./followed-context";

/** Shared niche cards stay cached. Follow marks stream in beside them. */
export function FollowedNicheFrame({ children }: { children: ReactNode }) {
  return (
    <FollowedOverrideProvider>
      {children}
      <Suspense fallback={null}>
        <FollowedSkillSeed />
      </Suspense>
    </FollowedOverrideProvider>
  );
}
