import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import destinationsData from "@/config/destinations.json";

const SESSION_TTL_SECONDS = 120;
export const SESSION_COOKIE = "redirect_session";

export type SessionPayload = {
  type: "redirect";
  exp: number;
  nonce: string;
  destinationId: string | null;
};

export type Destination = {
  name: string;
  url: string;
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 bytes");
  }
  return secret;
}

function signPayload(payload: object): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function readSignedPayload<T>(token: string): T | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encoded, suppliedSignature] = parts;
  if (!encoded || !suppliedSignature || !/^[A-Za-z0-9_-]+$/.test(suppliedSignature)) return null;

  try {
    const expected = createHmac("sha256", getSecret()).update(encoded).digest();
    const supplied = Buffer.from(suppliedSignature, "base64url");
    if (supplied.length !== expected.length || !timingSafeEqual(expected, supplied)) return null;

    const parsed: unknown = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return parsed && typeof parsed === "object" ? parsed as T : null;
  } catch {
    return null;
  }
}

export function createRedirectSession(destinationId: string | null = null): string {
  return signPayload({
    type: "redirect",
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    nonce: randomUUID(),
    destinationId,
  } satisfies SessionPayload);
}

export function getRedirectSession(token: string): SessionPayload | null {
  const payload = readSignedPayload<Partial<SessionPayload>>(token);
  if (
    !payload || payload.type !== "redirect" ||
    !Number.isInteger(payload.exp) || (payload.exp as number) <= Math.floor(Date.now() / 1000) ||
    typeof payload.nonce !== "string"
  ) return null;

  if (payload.destinationId !== undefined && payload.destinationId !== null) {
    if (typeof payload.destinationId !== "string" || !/^[-a-zA-Z0-9_]+$/.test(payload.destinationId)) {
      return null;
    }
  }

  return {
    type: "redirect",
    exp: payload.exp as number,
    nonce: payload.nonce,
    destinationId: payload.destinationId ?? null,
  };
}

export function verifyRedirectSession(token: string): boolean {
  return getRedirectSession(token) !== null;
}

function validateDestination(destination: { name?: unknown; url?: unknown }): Destination | null {
  if (typeof destination.name !== "string" || typeof destination.url !== "string") return null;

  const name = destination.name.trim();
  if (!name) return null;

  try {
    const url = new URL(destination.url);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return { name, url: url.toString() };
  } catch {
    return null;
  }
}

export function getDestinationById(destinationId: string): Destination | null {
  if (!/^[-a-zA-Z0-9_]+$/.test(destinationId)) return null;

  const destinations = destinationsData as Record<string, { name?: unknown; url?: unknown }>;
  const destination = destinations[destinationId];
  return destination ? validateDestination(destination) : null;
}

export function getRedirectDestination(): URL | null {
  const rawDestination = process.env.REDIRECT_DESTINATION;
  const allowedHosts = (process.env.REDIRECT_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  if (!rawDestination || allowedHosts.length === 0) return null;

  try {
    const destination = new URL(rawDestination);
    if (
      destination.protocol !== "https:" || destination.username || destination.password ||
      !allowedHosts.includes(destination.hostname.toLowerCase())
    ) return null;
    return destination;
  } catch {
    return null;
  }
}

export function getDestinationBySession(payload: SessionPayload): URL | null {
  if (payload.destinationId) {
    const destination = getDestinationById(payload.destinationId);
    return destination ? new URL(destination.url) : null;
  }
  return getRedirectDestination();
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const configuredOrigin = process.env.APP_ORIGIN;
  if (!origin || !configuredOrigin) return false;

  try {
    return new URL(origin).origin === new URL(configuredOrigin).origin;
  } catch {
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/r",
  maxAge: SESSION_TTL_SECONDS,
};

export const expiredSessionCookieOptions = { ...sessionCookieOptions, maxAge: 0 };
