import type { AuthRole } from "../utils/jwt.js";

// Attached by the auth middleware after a valid JWT is verified.
export interface AuthContext {
  id: string;
  role: AuthRole;
  operatorId?: string; // public HSX-YYYY-XXXX id, set for operators
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export {};
