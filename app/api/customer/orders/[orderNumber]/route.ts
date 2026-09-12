export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const session = await getCustomerSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderNumber } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        refund: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // STRICT SERVER-SIDE AUTHORIZATION CHECK
    const isOwner = order.userId === session.id;

    if (!isOwner) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view this order." },
        { status: 403 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Fetch order detail error:", error);
    return NextResponse.json({ error: "Failed to fetch order details." }, { status: 500 });
  }
}
