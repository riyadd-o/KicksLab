import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error("GET /api/admin/coupons error:", error);
    return NextResponse.json({ error: "Failed to fetch coupons." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code, discountType, value, minOrder, usageLimit, perCustomerLimit, expiry, active } = body;

    if (!code || !discountType || value === undefined) {
      return NextResponse.json({ error: "Code, discountType, and value are required." }, { status: 400 });
    }

    // Check for existing code
    const existing = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() }
    });
    if (existing) {
      return NextResponse.json({ error: "Coupon code already exists." }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        discountType,
        value: parseFloat(value),
        minOrder: minOrder !== null && minOrder !== undefined && String(minOrder).trim() !== "" ? parseFloat(String(minOrder)) : null,
        usageLimit: usageLimit !== null && usageLimit !== undefined && String(usageLimit).trim() !== "" ? parseInt(String(usageLimit), 10) : null,
        perCustomerLimit: perCustomerLimit !== null && perCustomerLimit !== undefined && String(perCustomerLimit).trim() !== "" ? parseInt(String(perCustomerLimit), 10) : null,
        expiry: expiry && String(expiry).trim() !== "" ? new Date(expiry) : null,
        active: active !== undefined ? Boolean(active) : true
      }
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/coupons error:", error);
    return NextResponse.json({ error: "Failed to create coupon." }, { status: 500 });
  }
}
