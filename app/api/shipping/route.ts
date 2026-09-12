import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.shippingSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      settings = await prisma.shippingSettings.create({
        data: {
          id: "singleton",
          freeShippingEnabled: true,
          freeShippingThreshold: 5000,
        },
      });
    }

    const zones = await prisma.shippingZone.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ settings, zones });
  } catch (error) {
    console.error("Fetch public shipping configuration error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipping configuration." },
      { status: 500 }
    );
  }
}
