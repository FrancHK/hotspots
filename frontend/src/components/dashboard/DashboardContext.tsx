"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useFetch } from "@/lib/useFetch";
import type { Operator } from "@/lib/types";

interface DashboardValue {
  operator: Operator | null;
  loading: boolean;
  reload: () => Promise<void>;
}

const DashboardContext = createContext<DashboardValue>({
  operator: null,
  loading: true,
  reload: async () => {},
});

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { data, loading, refetch } = useFetch<{ operator: Operator }>(
    "/auth/operator/me",
  );

  return (
    <DashboardContext.Provider
      value={{ operator: data?.operator ?? null, loading, reload: refetch }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => useContext(DashboardContext);

// Shared nav definition — used by the sidebar and elsewhere.
export const navItems = [
  { label: "Nyumbani", href: "/dashboard", icon: "house-door" },
  { label: "Vocha", href: "/dashboard/vouchers", icon: "ticket-perforated" },
  { label: "Pochi", href: "/dashboard/wallet", icon: "wallet2" },
  { label: "Vifurushi", href: "/dashboard/packages", icon: "box-seam" },
  { label: "Access Points", href: "/dashboard/access-points", icon: "router" },
  { label: "Portal", href: "/dashboard/portal", icon: "palette" },
  { label: "Miamala", href: "/dashboard/transactions", icon: "receipt" },
  { label: "Wasifu", href: "/dashboard/profile", icon: "person-circle" },
] as const;
