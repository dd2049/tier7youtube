import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "library_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12;

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "local-dev-secret";
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createAdminToken() {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${sign(issuedAt)}`;
}

export function verifyAdminToken(token) {
  if (!token) {
    return false;
  }

  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) {
    return false;
  }

  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age < 0 || age > MAX_AGE_SECONDS * 1000) {
    return false;
  }

  const expected = sign(issuedAt);
  if (signature.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function requireAdmin() {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(COOKIE_NAME)?.value);
}

export async function setAdminCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS
  });
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function isValidPassword(password) {
  const configured = process.env.ADMIN_PASSWORD || "change-me";
  if ((password || "").length !== configured.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(password || ""), Buffer.from(configured));
}
