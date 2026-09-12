import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PUT(req: NextRequest) {
  try {
    const session = await getAdminSession(req);

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bannerActive, discountPercentage, bannerText, buttonText, bannerLink, couponCode } = body;

    const parsedPercentage = Number(discountPercentage);
    if (isNaN(parsedPercentage) || parsedPercentage <= 0 || parsedPercentage > 100) {
      return NextResponse.json(
        { error: "Discount percentage must be a valid number between 1 and 100." },
        { status: 400 }
      );
    }

    const effectiveCouponCode = (couponCode && typeof couponCode === "string" ? couponCode.trim().toUpperCase() : "BLACKFRIDAY") || "BLACKFRIDAY";
    const constructedBannerText = bannerText && bannerText.trim().length > 0
      ? bannerText.trim()
      : `🖤 BLACK FRIDAY — UP TO ${parsedPercentage}% OFF SITEWIDE`;

    // Resilient lookup: check for singleton record or any existing promotion record
    let existing = await prisma.promotion.findUnique({
      where: { id: "singleton" },
    });

    if (!existing) {
      existing = await prisma.promotion.findFirst({
        orderBy: { updatedAt: "desc" },
      });
    }

    let promotion;
    if (existing) {
      promotion = await prisma.promotion.update({
        where: { id: existing.id },
        data: {
          bannerActive: Boolean(bannerActive),
          discountPercentage: parsedPercentage,
          couponCode: effectiveCouponCode,
          bannerText: constructedBannerText,
          buttonText: buttonText || "SHOP NOW",
          bannerLink: bannerLink || "/shop",
        },
      });
    } else {
      promotion = await prisma.promotion.create({
        data: {
          id: "singleton",
          bannerActive: Boolean(bannerActive),
          discountPercentage: parsedPercentage,
          couponCode: effectiveCouponCode,
          bannerText: constructedBannerText,
          buttonText: buttonText || "SHOP NOW",
          bannerLink: bannerLink || "/shop",
        },
      });
    }

    // Automatically synchronize dedicated Black Friday coupon in database
    await prisma.coupon.upsert({
      where: { code: effectiveCouponCode },
      update: {
        discountType: "percentage",
        value: parsedPercentage,
        active: Boolean(bannerActive),
      },
      create: {
        code: effectiveCouponCode,
        discountType: "percentage",
        value: parsedPercentage,
        active: Boolean(bannerActive),
      },
    });

    return NextResponse.json({ success: true, promotion });
  } catch (error: any) {
    console.error("PUT /api/admin/promotions error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update promotions" }, { status: 500 });
  }
}
