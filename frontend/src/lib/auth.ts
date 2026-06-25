// Client-side session storage for the JWT + the logged-in user.

export type Role = "admin" | "operator";

const TOKEN_KEY = "hotspotx-token";
const ROLE_KEY = "hotspotx-role";
const USER_KEY = "hotspotx-user";

export interface StoredUser {
  id: string;
  name?: string;
  email?: string;
  businessName?: string;
  operatorId?: string;
  status?: string;
  deviceType?: string;
  onboardingComplete?: boolean;
  [key: string]: unknown;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole(): Role | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ROLE_KEY) as Role | null;
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function setSession(token: string, role: Role, user: StoredUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthed(): boolean {
  return !!getToken();
}
