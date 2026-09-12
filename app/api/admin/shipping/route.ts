import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

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
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ settings, zones });
  } catch (error) {
    console.error("Fetch admin shipping error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin shipping settings." },
      { status: 500 }
    );
  }
}
