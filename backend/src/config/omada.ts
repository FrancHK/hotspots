import axios from "axios";
import https from "node:https";
import { env } from "./env.js";
import type {
  AuthorizeParams,
  AuthorizeResult,
  NetworkAdapter,
} from "../services/network/types.js";

// Omada Controller v6 hotspot adapter.
//
// Session model: after POST /api/v2/login the controller returns
//   { errorCode, result: { omadacId, token } }
// and sets a TPOMADA_SESSIONID cookie. EVERY subsequent request must send
// BOTH that cookie AND a `Csrf-Token` header equal to `token`.

interface OmadaSession {
  controllerId: string;
  token: string; // used as Csrf-Token
  cookie: string; // TPOMADA_SESSIONID=...
}

function httpsAgent() {
  return new https.Agent({ rejectUnauthorized: env.omada.verifySsl });
}

async function login(): Promise<OmadaSession> {
  const url = `${env.omada.baseUrl}/api/v2/login`;
  const res = await axios.post(
    url,
    { username: env.omada.user, password: env.omada.pass },
    { httpsAgent: httpsAgent(), timeout: 10_000 },
  );

  if (res.data?.errorCode !== 0 || !res.data?.result?.token) {
    throw new Error(
      `Omada login failed (errorCode ${res.data?.errorCode ?? "?"})`,
    );
  }

  const setCookie: string[] = res.headers["set-cookie"] ?? [];
  const sessionCookie =
    setCookie.find((c) => c.startsWith("TPOMADA_SESSIONID="))?.split(";")[0] ??
    "";

  return {
    controllerId: env.omada.controllerId || res.data.result.omadacId,
    token: res.data.result.token,
    cookie: sessionCookie,
  };
}

async function authorizeReal(params: AuthorizeParams): Promise<AuthorizeResult> {
  if (!env.omada.baseUrl) {
    throw new Error("Omada base URL is not configured");
  }
  if (!params.omadaSiteId) {
    throw new Error("Missing Omada site id for authorization");
  }

  const session = await login();
  const url = `${env.omada.baseUrl}/${session.controllerId}/api/v2/hotspot/sites/${params.omadaSiteId}/cmd/clients/auth`;

  const body = {
    mac: params.clientMac,
    time: params.durationMinutes * 60_000, // controller expects milliseconds
    flowDown: params.speedMbps * 1024, // kbps
    flowUp: params.speedMbps * 1024, // kbps
  };

  const res = await axios.post(url, body, {
    httpsAgent: httpsAgent(),
    timeout: 10_000,
    headers: {
      "Content-Type": "application/json",
      "Csrf-Token": session.token,
      Cookie: session.cookie,
    },
  });

  if (res.data?.errorCode !== 0) {
    throw new Error(
      `Omada authorize failed (errorCode ${res.data?.errorCode ?? "?"})`,
    );
  }

  return { success: true, provider: "omada", simulated: false };
}

export const omadaAdapter: NetworkAdapter = {
  provider: "omada",
  async authorize(params: AuthorizeParams): Promise<AuthorizeResult> {
    if (env.network.simulate) {
      return {
        success: true,
        provider: "omada",
        simulated: true,
        detail: `Simulated Omada auth for ${params.clientMac} (${params.durationMinutes}m @ ${params.speedMbps}Mbps)`,
      };
    }
    return authorizeReal(params);
  },
};
