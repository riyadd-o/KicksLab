import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "kicks_lab_shoes_shop_secret_key_2026_isolated"
);

export const ADMIN_COOKIE = "kl_admin_session";
export const CUSTOMER_COOKIE = "kl_customer_session";

export interface SessionPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Generate JWT token
export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET_KEY);
}

// Verify JWT token
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
    };
  } catch (error) {
    return null;
  }
}

// Get ADMIN session from kl_admin_session cookie
export async function getAdminSession(req?: NextRequest): Promise<SessionPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(ADMIN_COOKIE)?.value;
  }
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(ADMIN_COOKIE)?.value;
    } catch (e) {}
  }

  if (token) {
    const session = await verifyToken(token);
    if (session && (session.role === "ADMIN" || session.role === "STAFF")) {
      return session;
    }
  }

  try {
    const nextAuthSession = await auth();
    if (nextAuthSession?.user && (nextAuthSession.user as any).role === "ADMIN") {
      return {
        id: (nextAuthSession.user as any).id,
        email: nextAuthSession.user.email || "",
        name: nextAuthSession.user.name || "",
        role: (nextAuthSession.user as any).role,
      };
    }
  } catch (e) {}

  return null;
}

// Get CUSTOMER session from kl_customer_session cookie
export async function getCustomerSession(req?: NextRequest): Promise<SessionPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(CUSTOMER_COOKIE)?.value;
  }
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(CUSTOMER_COOKIE)?.value;
    } catch (e) {}
  }

  if (token) {
    const session = await verifyToken(token);
    if (session && (session.role === "USER" || session.role === "CUSTOMER")) {
      return session;
    }
  }

  return null;
}

// Set ADMIN session cookie on response
export function setAdminCookie(res: NextResponse, token: string) {
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

// Set CUSTOMER session cookie on response
export function setCustomerCookie(res: NextResponse, token: string) {
  res.cookies.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

// Clear ADMIN session cookie only
export function clearAdminCookie(res: NextResponse) {
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

// Clear CUSTOMER session cookie only
export function clearCustomerCookie(res: NextResponse) {
  res.cookies.set(CUSTOMER_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
