"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ShellRole = "USER" | "ADMIN";

const ShellRoleContext = createContext<ShellRole>("USER");
const SetShellRoleContext = createContext<(role: ShellRole) => void>(() => {});

export function ShellRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<ShellRole>("USER");
  return (
    <SetShellRoleContext.Provider value={setRole}>
      <ShellRoleContext.Provider value={role}>{children}</ShellRoleContext.Provider>
    </SetShellRoleContext.Provider>
  );
}

export function useShellRole() {
  return useContext(ShellRoleContext);
}

/** The account menu streams in after the shell. This publishes the role for the nav. */
export function PublishShellRole({ role }: { role: ShellRole }) {
  const setRole = useContext(SetShellRoleContext);
  useEffect(() => {
    setRole(role);
  }, [role, setRole]);
  return null;
}
