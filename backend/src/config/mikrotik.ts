import { env } from "./env.js";
import type {
  AuthorizeParams,
  AuthorizeResult,
  NetworkAdapter,
} from "../services/network/types.js";

// MikroTik RouterOS hotspot adapter (RouterOS API, default port 8728).
//
// Authorizes a client by registering a hotspot user keyed on its MAC with an
// uptime limit and a rate-limit (speed cap), then logging it into the active
// list. Connection details live on the AccessPoint, passed via params.mikrotik.

async function authorizeReal(params: AuthorizeParams): Promise<AuthorizeResult> {
  const mt = params.mikrotik;
  if (!mt?.ip || !mt.user) {
    throw new Error("Missing MikroTik connection details");
  }

  // Lazily import the CJS library so it is only loaded when actually needed.
  const { RouterOSAPI } = (await import("node-routeros")) as unknown as {
    RouterOSAPI: new (cfg: {
      host: string;
      user: string;
      password: string;
      port: number;
      timeout?: number;
    }) => {
      connect(): Promise<unknown>;
      write(menu: string, params: string[]): Promise<unknown>;
      close(): void;
    };
  };

  const conn = new RouterOSAPI({
    host: mt.ip,
    user: mt.user,
    password: mt.pass,
    port: mt.port || 8728,
    timeout: 10,
  });

  await conn.connect();
  try {
    const rate = `${params.speedMbps}M/${params.speedMbps}M`; // up/down
    const uptime = `${params.durationMinutes}m`;

    // Create (or refresh) a hotspot user bound to this MAC.
    await conn.write("/ip/hotspot/user/add", [
      `=name=${params.clientMac}`,
      `=mac-address=${params.clientMac}`,
      `=limit-uptime=${uptime}`,
      `=rate-limit=${rate}`,
    ]);

    // Place the client into the active list immediately.
    await conn.write("/ip/hotspot/active/login", [
      `=mac-address=${params.clientMac}`,
      `=user=${params.clientMac}`,
    ]);

    return { success: true, provider: "mikrotik", simulated: false };
  } finally {
    conn.close();
  }
}

export const mikrotikAdapter: NetworkAdapter = {
  provider: "mikrotik",
  async authorize(params: AuthorizeParams): Promise<AuthorizeResult> {
    if (env.network.simulate) {
      return {
        success: true,
        provider: "mikrotik",
        simulated: true,
        detail: `Simulated MikroTik auth for ${params.clientMac} (${params.durationMinutes}m @ ${params.speedMbps}Mbps)`,
      };
    }
    return authorizeReal(params);
  },
};
