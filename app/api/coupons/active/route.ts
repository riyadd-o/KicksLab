import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const coupons = await prisma.coupon.findMany({
      where: {
        active: true,
        OR: [
          { expiry: null },
          { expiry: { gte: new Date() } }
        ]
      },
      orderBy: { createdAt: "desc" } // Return most recently created coupon first
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error("GET /api/coupons/active error:", error);
    return NextResponse.json(
      { error: "Failed to fetch active coupons." },
      { status: 500 }
    );
  }
}
