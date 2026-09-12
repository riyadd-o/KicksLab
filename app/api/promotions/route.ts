import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    let promotion = await prisma.promotion.findUnique({
      where: { id: "singleton" },
    });

    if (!promotion) {
      promotion = await prisma.promotion.findFirst({
        orderBy: { updatedAt: "desc" },
      });
    }

    if (!promotion) {
      // Create default singleton record if none exists
      promotion = await prisma.promotion.create({
        data: {
          id: "singleton",
          bannerActive: true,
          discountPercentage: 50,
          couponCode: "BLACKFRIDAY",
          bannerText: "🖤 BLACK FRIDAY — UP TO 50% OFF SITEWIDE",
          buttonText: "SHOP NOW",
          bannerLink: "/shop",
        },
      });
    }

    return NextResponse.json(promotion);
  } catch (error) {
    console.error("GET /api/promotions error:", error);
    return NextResponse.json({ error: "Failed to fetch promotions" }, { status: 500 });
  }
}
