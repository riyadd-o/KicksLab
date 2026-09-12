import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession(req);
    if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { code, discountType, value, minOrder, usageLimit, perCustomerLimit, expiry, active } = body;

    const updatedData: any = {};
    if (code !== undefined) {
      const normalizedCode = code.trim().toUpperCase();
      const existing = await prisma.coupon.findFirst({
        where: {
          code: normalizedCode,
          id: { not: id }
        }
      });
      if (existing) {
        return NextResponse.json({ error: "Another coupon already exists with this code." }, { status: 400 });
      }
      updatedData.code = normalizedCode;
    }
    if (discountType !== undefined) updatedData.discountType = discountType;
    if (value !== undefined) updatedData.value = parseFloat(value);
    if (minOrder !== undefined) updatedData.minOrder = minOrder !== null && minOrder !== undefined && String(minOrder).trim() !== "" ? parseFloat(String(minOrder)) : null;
    if (usageLimit !== undefined) updatedData.usageLimit = usageLimit !== null && usageLimit !== undefined && String(usageLimit).trim() !== "" ? parseInt(String(usageLimit), 10) : null;
    if (perCustomerLimit !== undefined) updatedData.perCustomerLimit = perCustomerLimit !== null && perCustomerLimit !== undefined && String(perCustomerLimit).trim() !== "" ? parseInt(String(perCustomerLimit), 10) : null;
    if (expiry !== undefined) updatedData.expiry = expiry && String(expiry).trim() !== "" ? new Date(expiry) : null;
    if (active !== undefined) updatedData.active = Boolean(active);

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updatedData
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.error("PUT /api/admin/coupons/[id] error:", error);
    return NextResponse.json({ error: "Failed to update coupon." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.coupon.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/coupons/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete coupon." }, { status: 500 });
  }
}
