export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { transitionOrderStatus } from "@/lib/order-transition";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession(req);
    if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const { id } = await params;
    const { status, internalNote, cancelReason } = await req.json();

    const order = await transitionOrderStatus({
      orderId: id,
      newStatus: status,
      internalNote,
      cancelReason,
    });

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Admin order update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update order" },
      { status: 500 }
    );
  }
}
