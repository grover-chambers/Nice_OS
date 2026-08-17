"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { ROLE_CONFIG } from "@/lib/data/shared";
import type { Role } from "@/lib/data/types";

type RoleContextValue = {
  role: Role;
  setRole: (r: Role) => void;
  config: (typeof ROLE_CONFIG)[Role];
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("admin");

  const setRole = (r: Role) => {
    setRoleState(r);
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