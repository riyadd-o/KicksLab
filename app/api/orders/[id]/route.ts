import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    const body = await req.json();
    const { status, internalNote, cancelReason, action } = body;

    // Dedicated action for marking Cash on Delivery orders as paid
    if (action === "MARK_COD_PAID") {
      const existingOrder = await prisma.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!existingOrder) {
        return NextResponse.json({ error: "Order not found." }, { status: 404 });
      }

      const isCOD =
        existingOrder.paymentMethod === "CASH_ON_DELIVERY" ||
        existingOrder.paymentMethod === "COD";

      if (!isCOD) {
        return NextResponse.json(
          { error: "Only Cash on Delivery orders can be marked as paid through this action." },
          { status: 400 }
        );
      }

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          paymentStatus: "PAID",
          paidAt: new Date(),
        },
        include: { items: true },
      });

      return NextResponse.json(updatedOrder);
    }

    const order = await transitionOrderStatus({
      orderId: id,
      newStatus: status,
      internalNote,
      cancelReason,
    });

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update order" },
      { status: 500 }
    );
  }
}
