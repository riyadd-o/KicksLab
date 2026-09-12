import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function PUT(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { freeShippingEnabled, freeShippingThreshold } = body;

    const thresholdNum = parseFloat(freeShippingThreshold);
    if (isNaN(thresholdNum) || thresholdNum < 0) {
      return NextResponse.json(
        { error: "Free shipping threshold must be a non-negative number." },
        { status: 400 }
      );
    }

    const settings = await prisma.shippingSettings.upsert({
      where: { id: "singleton" },
      update: {
        freeShippingEnabled: Boolean(freeShippingEnabled),
        freeShippingThreshold: thresholdNum,
      },
      create: {
        id: "singleton",
        freeShippingEnabled: Boolean(freeShippingEnabled),
        freeShippingThreshold: thresholdNum,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Update shipping settings error:", error);
    return NextResponse.json(
      { error: "Failed to update shipping settings." },
      { status: 500 }
    );
  }
}
