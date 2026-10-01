"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ShellRole = "USER" | "ADMIN";

const ShellRoleContext = createContext<ShellRole>("USER");
const SetShellRoleContext = createContext<(role: ShellRole) => void>(() => {});

/** Open contributions this person can review. Null hides the Review link. */
const ShellReviewContext = createContext<number | null>(null);
const SetShellReviewContext = createContext<(count: number | null) => void>(() => {});

export function ShellRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<ShellRole>("USER");
  const [review, setReview] = useState<number | null>(null);
  return (
    <SetShellRoleContext.Provider value={setRole}>
      <SetShellReviewContext.Provider value={setReview}>
        <ShellRoleContext.Provider value={role}>
          <ShellReviewContext.Provider value={review}>{children}</ShellReviewContext.Provider>
        </ShellRoleContext.Provider>
      </SetShellReviewContext.Provider>
    </SetShellRoleContext.Provider>
  );
}

export function useShellRole() {
  return useContext(ShellRoleContext);
}

export function useShellReview() {
  return useContext(ShellReviewContext);
}

/** The account menu streams in after the shell. This publishes the role for the nav. */
export function PublishShellRole({ role }: { role: ShellRole }) {
  const setRole = useContext(SetShellRoleContext);
  useEffect(() => {
    setRole(role);
  }, [role, setRole]);
  return null;
}

/** The review count streams in on the request. This publishes it for the nav. */
export function PublishShellReview({ count }: { count: number | null }) {
  const setReview = useContext(SetShellReviewContext);
  useEffect(() => {
    setReview(count);
  }, [count, setReview]);
  return null;
}
