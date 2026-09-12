import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, city, fee, active } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (city !== undefined) updateData.city = city.trim();
    if (active !== undefined) updateData.active = Boolean(active);
    if (fee !== undefined) {
      const feeNum = parseFloat(fee);
      if (isNaN(feeNum) || feeNum < 0) {
        return NextResponse.json(
          { error: "Shipping fee must be a valid non-negative number." },
          { status: 400 }
        );
      }
      updateData.fee = feeNum;
    }

    const updatedZone = await prisma.shippingZone.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedZone);
  } catch (error) {
    console.error("Update shipping zone error:", error);
    return NextResponse.json(
      { error: "Failed to update shipping zone." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.shippingZone.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete shipping zone error:", error);
    return NextResponse.json(
      { error: "Failed to delete shipping zone." },
      { status: 500 }
    );
  }
}
