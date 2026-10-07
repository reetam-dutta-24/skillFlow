"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const FollowedIdsContext = createContext<ReadonlySet<string> | null>(null);
const SetFollowedContext = createContext<(id: string, followed: boolean) => void>(() => {});
const PublishFollowedContext = createContext<(ids: string[]) => void>(() => {});

export function useFollowedSkill(skillId: string, fallback: boolean) {
  const ids = useContext(FollowedIdsContext);
  return ids ? ids.has(skillId) : fallback;
}

export function useSetFollowed() {
  return useContext(SetFollowedContext);
}

export function FollowedOverrideProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<ReadonlySet<string> | null>(null);
  const publish = useMemo(() => (next: string[]) => setIds(new Set(next)), []);
  const setFollowed = useMemo(
    () => (id: string, followed: boolean) => {
      setIds((current) => {
        const next = new Set(current ?? []);
        if (followed) next.add(id);
        else next.delete(id);
        return next;
      });
    },
    [],
  );
  return (
    <PublishFollowedContext.Provider value={publish}>
      <SetFollowedContext.Provider value={setFollowed}>
        <FollowedIdsContext.Provider value={ids}>{children}</FollowedIdsContext.Provider>
      </SetFollowedContext.Provider>
    </PublishFollowedContext.Provider>
  );
}

export function PublishFollowedIds({ ids }: { ids: string[] }) {
  const publish = useContext(PublishFollowedContext);
  useEffect(() => {
    publish(ids);
  }, [ids, publish]);
  return null;
}
