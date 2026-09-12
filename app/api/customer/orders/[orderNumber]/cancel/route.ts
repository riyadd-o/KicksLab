export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { transitionOrderStatus } from "@/lib/order-transition";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await getCustomerSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const { orderNumber } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || "Cancelled by customer";

    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Strict ownership verification: Customer can only cancel their own order
    if (order.userId !== session.id) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to cancel this order." },
        { status: 403 }
      );
    }

    // Lifecycle validation: Only allow cancellation for COD orders in cancellable states
    if (order.status === "CANCELLED") {
      return NextResponse.json({ error: "Order is already cancelled." }, { status: 400 });
    }

    if (order.status === "REFUNDED") {
      return NextResponse.json({ error: "Order has already been refunded." }, { status: 400 });
    }

    const pm = (order.paymentMethod || "").trim().toUpperCase();
    const isCod = pm === "CASH_ON_DELIVERY" || pm === "COD" || pm.includes("CASH");

    if (!isCod) {
      return NextResponse.json(
        { error: "Direct cancellation is only available for Cash on Delivery orders. For Chapa orders, please request a refund." },
        { status: 400 }
      );
    }

    if (!["PENDING", "PROCESSING", "PACKED", "SHIPPED"].includes(order.status)) {
      return NextResponse.json(
        { error: `Order cannot be cancelled at this stage (${order.status}).` },
        { status: 400 }
      );
    }

    const updatedOrder = await transitionOrderStatus({
      orderId: order.id,
      newStatus: "CANCELLED",
      cancelReason: reason,
    });

    return NextResponse.json({
      success: true,
      message: "Order successfully cancelled.",
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("Customer order cancellation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel order." },
      { status: 500 }
    );
  }
}
