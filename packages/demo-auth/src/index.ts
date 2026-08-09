import { jwtVerify, SignJWT, type JWTPayload } from "jose";

export const DEMO_SESSION_COOKIE = "multi_agent_demo_session";

export type DemoRole = "admin" | "customer";
export type CommerceRole = DemoRole | "web";

export interface DemoPrincipal {
  id: string;
  email: string;
  name: string;
  role: DemoRole;
  workspaceId: string;
}

export interface CommercePrincipal {
  id: string;
  role: CommerceRole;
  workspaceId: string;
}

export const DEMO_PERSONAS: Record<DemoRole, DemoPrincipal> = {
  customer: {
    id: "usr_customer_avery",
    email: "avery@example.com",
    name: "Avery Morgan",
    role: "customer",
    workspaceId: "wrk_reference_store",
  },
  admin: {
    id: "usr_admin_riley",
    email: "riley@example.com",
    name: "Riley Chen",
    role: "admin",
    workspaceId: "wrk_reference_store",
  },
};

const ISSUER = "multi-agent-services";
const SESSION_AUDIENCE = "storefront";
const COMMERCE_AUDIENCE = "commerce";

function getSecret(): Uint8Array {
  const secret = process.env.DEMO_AUTH_SECRET;
  if (!secret) {
    throw new Error("DEMO_AUTH_SECRET is required.");
  }
  if (secret.length < 32) {
    throw new Error("DEMO_AUTH_SECRET must contain at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

function stringClaim(payload: JWTPayload, key: string): string {
  const value = payload[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing JWT claim: ${key}`);
  }
  return value;
}

function roleClaim(payload: JWTPayload): CommerceRole {
  const role = payload.role;
  if (role === "admin" || role === "customer" || role === "web") return role;
  throw new Error("Invalid JWT role.");
}

export async function createDemoSessionToken(role: DemoRole): Promise<string> {
  const principal = DEMO_PERSONAS[role];
  return new SignJWT({
    email: principal.email,
    name: principal.name,
    role: principal.role,
    workspaceId: principal.workspaceId,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setSubject(principal.id)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getSecret());
}

export async function verifyDemoSessionToken(
  token: string,
): Promise<DemoPrincipal> {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: ISSUER,
    audience: SESSION_AUDIENCE,
  });
  const role = roleClaim(payload);
  if (role === "web") throw new Error("A web token is not a demo session.");
  return {
    id: stringClaim(payload, "sub"),
    email: stringClaim(payload, "email"),
    name: stringClaim(payload, "name"),
    role,
    workspaceId: stringClaim(payload, "workspaceId"),
  };
}

export async function createCommerceAccessToken(
  principal: CommercePrincipal,
): Promise<string> {
  return new SignJWT({
    role: principal.role,
    workspaceId: principal.workspaceId,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(ISSUER)
    .setAudience(COMMERCE_AUDIENCE)
    .setSubject(principal.id)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(getSecret());
}

export async function verifyCommerceAccessToken(
  token: string,
): Promise<CommercePrincipal> {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: ISSUER,
    audience: COMMERCE_AUDIENCE,
  });
  return {
    id: stringClaim(payload, "sub"),
    role: roleClaim(payload),
    workspaceId: stringClaim(payload, "workspaceId"),
  };
}

export function readCookie(
  cookieHeader: string | null,
  name: string,
): string | null {
  if (!cookieHeader) return null;
  for (const pair of cookieHeader.split(";")) {
    const separator = pair.indexOf("=");
    if (separator === -1) continue;
    const key = pair.slice(0, separator).trim();
    if (key !== name) continue;
    try {
      return decodeURIComponent(pair.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

export async function authenticateDemoRequest(
  request: Request,
): Promise<DemoPrincipal | null> {
  const token = readCookie(request.headers.get("cookie"), DEMO_SESSION_COOKIE);
  if (!token) return null;
  try {
    return await verifyDemoSessionToken(token);
  } catch {
    return null;
  }
}

export function serializeDemoSessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${DEMO_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${secure}`;
}

export function clearDemoSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${DEMO_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
