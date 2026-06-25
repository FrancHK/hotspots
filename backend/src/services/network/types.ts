// Shared contract every network adapter (Omada, MikroTik, future vendors)
// must implement, so the hotspot flow is identical regardless of hardware.

export interface AuthorizeParams {
  clientMac: string;
  durationMinutes: number;
  speedMbps: number;

  // Omada-specific: the controller's site id this AP belongs to.
  omadaSiteId?: string | null;

  // MikroTik-specific: how to reach the router (stored on the AccessPoint).
  mikrotik?: {
    ip: string;
    user: string;
    pass: string;
    port: number;
  } | null;
}

export interface AuthorizeResult {
  success: boolean;
  provider: "omada" | "mikrotik";
  simulated: boolean;
  detail?: string;
}

export interface NetworkAdapter {
  readonly provider: "omada" | "mikrotik";
  authorize(params: AuthorizeParams): Promise<AuthorizeResult>;
}
