export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transitionOrderStatus } from "@/lib/order-transition";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId, email, reason } = body;

    if (!orderId || !email) {
      return NextResponse.json(
        { error: "Order ID and email are required to cancel an order." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderId.trim(),
        customerEmail: { equals: email.trim(), mode: "insensitive" },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "No matching order found for this order ID and email combination." },
        { status: 404 }
      );
    }

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
      cancelReason: reason || "Cancelled from order tracking",
    });

    return NextResponse.json({
      success: true,
      message: "Order has been successfully cancelled.",
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("Guest order cancellation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel order." },
      { status: 500 }
    );
  }
}
