import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "./db";

const COOKIE_NAME = "eigyounabi_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14日間

type SessionPayload = {
  userId: string;
  tenantId: string;
  role: string; // SALES | MANAGER | ADMIN
  exp: number;
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET が設定されていません。.env を確認してください。");
  }
  return secret;
}

function base64url(input: Buffer): string {
  return input.toString("base64url");
}

function sign(payloadB64: string): string {
  const hmac = crypto.createHmac("sha256", getSecret());
  hmac.update(payloadB64);
  return base64url(hmac.digest());
}

export function createSessionToken(payload: Omit<SessionPayload, "exp">): string {
  const full: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const payloadB64 = base64url(Buffer.from(JSON.stringify(full)));
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;
  const expected = sign(payloadB64);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const payload: SessionPayload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: Omit<SessionPayload, "exp">) {
  const token = createSessionToken(payload);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie() {
  cookies().set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { tenant: true },
  });
  return user;
}
