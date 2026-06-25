import type { DeviceType } from "@prisma/client";
import { omadaAdapter } from "../../config/omada.js";
import { mikrotikAdapter } from "../../config/mikrotik.js";
import type {
  AuthorizeParams,
  AuthorizeResult,
  NetworkAdapter,
} from "./types.js";

// Adapter registry — add future vendors here without touching call sites.
const adapters: Record<DeviceType, NetworkAdapter> = {
  omada: omadaAdapter,
  mikrotik: mikrotikAdapter,
};

export function getAdapter(deviceType: DeviceType): NetworkAdapter {
  return adapters[deviceType];
}

// Unified entry point: opens internet access for a client, routing to the
// correct adapter based on the operator's device type. The captive-portal
// flow calls this and never needs to know which hardware is behind it.
export async function authorizeClient(
  deviceType: DeviceType,
  params: AuthorizeParams,
): Promise<AuthorizeResult> {
  const adapter = getAdapter(deviceType);
  if (!adapter) {
    throw new Error(`No network adapter for device type: ${deviceType}`);
  }
  return adapter.authorize(params);
}

export type { AuthorizeParams, AuthorizeResult } from "./types.js";
