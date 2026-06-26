"use client";

import { createContext, useContext, type ReactNode } from "react";
import { getStoredUser, type StoredUser } from "@/lib/auth";
import { useMounted } from "@/lib/useMounted";

interface AdminValue {
  admin: StoredUser | null;
}

const AdminContext = createContext<AdminValue>({ admin: null });

export function AdminProvider({ children }: { children: ReactNode }) {
  // Read the session profile only after hydration to avoid a server/client
  // mismatch (localStorage is unavailable on the server).
  const mounted = useMounted();
  const admin = mounted ? getStoredUser() : null;

  return (
    <AdminContext.Provider value={{ admin }}>{children}</AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);

// Shared admin nav — Bootstrap Icons + Swahili labels.
export const adminNavItems = [
  { label: "Nyumbani", href: "/admin", icon: "speedometer2" },
  { label: "Operators", href: "/admin/operators", icon: "people" },
  { label: "Wanaosubiri", href: "/admin/pending", icon: "hourglass-split" },
  { label: "Ongeza Operator", href: "/admin/add-operator", icon: "person-plus" },
  { label: "Commission", href: "/admin/commission", icon: "cash-stack" },
  { label: "Miamala", href: "/admin/transactions", icon: "receipt-cutoff" },
  { label: "Arifa", href: "/admin/notifications", icon: "megaphone" },
  { label: "Access Points", href: "/admin/access-points", icon: "router" },
  { label: "Mipangilio", href: "/admin/settings", icon: "gear" },
] as const;
