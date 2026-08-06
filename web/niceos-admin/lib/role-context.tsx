"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ROLE_CONFIG } from "@/lib/data";
import type { Role } from "@/lib/data/types";

type RoleContextValue = {
  role: Role;
  setRole: (r: Role) => void;
  config: (typeof ROLE_CONFIG)[Role];
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("admin");

  useEffect(() => {
    const stored = window.localStorage.getItem("niceos-role") as Role | null;
    if (stored && stored in ROLE_CONFIG) setRoleState(stored);
  }, []);

  const setRole = (r: Role) => {
    setRoleState(r);
    window.localStorage.setItem("niceos-role", r);
  };

  const value = useMemo(
    () => ({ role, setRole, config: ROLE_CONFIG[role] }),
    [role]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
