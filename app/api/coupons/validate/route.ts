import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
    }

    const normalizedCode = String(code).trim().toUpperCase();

    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode }
    });

    if (!coupon) {
      return NextResponse.json({ error: "Invalid or expired coupon code." }, { status: 404 });
    }

    if (!coupon.active) {
      return NextResponse.json({ error: "This coupon is no longer active." }, { status: 400 });
    }

    // Expiry check
    if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
      return NextResponse.json({ error: "Invalid or expired coupon code." }, { status: 400 });
    }

    // Total Global Usage limit check
    if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "This coupon has reached its total usage limit." }, { status: 400 });
    }

    // Per-Customer Usage limit check
    if (coupon.perCustomerLimit !== null && coupon.perCustomerLimit !== undefined) {
      const customerSession = await getCustomerSession(req);
      if (!customerSession?.id) {
        return NextResponse.json({
          error: "Please sign in to your account to use this coupon.",
          requiresAuth: true
        }, { status: 401 });
      }

      // Count redemptions by this user in CouponUsage
      const usageCount = (prisma as any).couponUsage ? await prisma.couponUsage.count({
        where: {
          couponId: coupon.id,
          userId: customerSession.id
        }
      }) : 0;

      if (usageCount >= coupon.perCustomerLimit) {
        return NextResponse.json({
          error: "You have already used this coupon."
        }, { status: 400 });
      }
    }

    // Minimum order check
    const orderSubtotal = parseFloat(subtotal || 0);
    if (coupon.minOrder !== null && coupon.minOrder > 0 && orderSubtotal < coupon.minOrder) {
      return NextResponse.json({
        error: `Minimum order amount for this coupon is ETB ${coupon.minOrder.toLocaleString()}.`
      }, { status: 400 });
    }

    // Success! Return coupon details
    return NextResponse.json({
      success: true,
      coupon: {
        id:               coupon.id,
        code:             coupon.code,
        discountType:     coupon.discountType,
        value:            coupon.value,
        minOrder:         coupon.minOrder,
        usageLimit:       coupon.usageLimit,
        perCustomerLimit: coupon.perCustomerLimit,
      }
    });
  } catch (error) {
    console.error("POST /api/coupons/validate error:", error);
    return NextResponse.json(
      { error: "An error occurred while validating the coupon." },
      { status: 500 }
    );
  }
}

