import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, city, fee, active } = body;

    if (!name || !city) {
      return NextResponse.json(
        { error: "Zone name and city/location are required." },
        { status: 400 }
      );
    }

    const feeNum = parseFloat(fee);
    if (isNaN(feeNum) || feeNum < 0) {
      return NextResponse.json(
        { error: "Shipping fee must be a valid non-negative number." },
        { status: 400 }
      );
    }

    const zone = await prisma.shippingZone.create({
      data: {
        name: name.trim(),
        city: city.trim(),
        fee: feeNum,
        active: active ?? true,
      },
    });

    return NextResponse.json(zone, { status: 201 });
  } catch (error) {
    console.error("Create shipping zone error:", error);
    return NextResponse.json(
      { error: "Failed to create shipping zone." },
      { status: 500 }
    );
  }
}
