import { NextRequest, NextResponse } from "next/server";
import { verifyToken, ADMIN_COOKIE, CUSTOMER_COOKIE } from "@/lib/session";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin routes ─────────────────────────────────────
  const isPublicAdminRoute =
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/admin/forgot-password") ||
    pathname.startsWith("/admin/reset-password");

  if (pathname.startsWith("/admin") && !isPublicAdminRoute) {
    const adminToken = req.cookies.get(ADMIN_COOKIE)?.value;
    const adminSession = adminToken ? await verifyToken(adminToken) : null;

    if (!adminSession || (adminSession.role !== "ADMIN" && adminSession.role !== "STAFF")) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // ── Customer routes (/account/*) ──────────────────────
  if (pathname.startsWith("/account")) {
    const customerToken = req.cookies.get(CUSTOMER_COOKIE)?.value;
    const customerSession = customerToken ? await verifyToken(customerToken) : null;

    if (!customerSession || (customerSession.role !== "USER" && customerSession.role !== "CUSTOMER")) {
      return NextResponse.redirect(new URL("/signin", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/account", "/account/:path*"],
};
