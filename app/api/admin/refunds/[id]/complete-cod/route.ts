import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { sendRefundSuccessEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Admin access required." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { adminNote } = body;

    const refund = await prisma.refund.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!refund) {
      return NextResponse.json({ error: "Refund record not found." }, { status: 404 });
    }

    const order = refund.order;
    if (!order) {
      return NextResponse.json({ error: "Associated order not found." }, { status: 404 });
    }

    // Verify payment method is Cash on Delivery
    const pm = (refund.paymentMethod || order.paymentMethod || "").trim().toUpperCase();
    const isCod = pm === "CASH_ON_DELIVERY" || pm === "COD" || pm.includes("CASH");

    if (!isCod) {
      return NextResponse.json(
        { error: "Direct payout completion is only available for Cash on Delivery refunds. For online payments, use Chapa processing." },
        { status: 400 }
      );
    }

    // Idempotency: Reject duplicate completion
    if (refund.status === "REFUNDED") {
      return NextResponse.json(
        { error: "Refund has already been completed." },
        { status: 400 }
      );
    }

    // Server-side amount validation
    const finalAmount = Math.min(refund.amount, order.total);

    // Atomically transition to REFUNDED
    const updatedRefund = await prisma.refund.update({
      where: { id },
      data: {
        status: "REFUNDED",
        amount: finalAmount,
        adminNote: adminNote !== undefined ? adminNote : refund.adminNote,
        resolvedAt: new Date(),
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { status: "REFUNDED" },
    });

    // Idempotent completion email dispatch
    if (!refund.completionNotifiedAt) {
      sendRefundSuccessEmail({
        to: updatedRefund.customerEmail,
        customerName: updatedRefund.customerName,
        refundNumber: updatedRefund.refundNumber,
        orderNumber: order.orderNumber,
        amount: updatedRefund.amount,
        paymentMethod: "Cash on Delivery",
        refundMethod: updatedRefund.refundMethod,
        refundAccountName: updatedRefund.refundAccountName,
        refundAccountNumber: updatedRefund.refundAccountNumber,
        refundPhoneNumber: updatedRefund.refundPhoneNumber,
        chapaRefundRef: null,
      })
        .then(async (res) => {
          if (res.success) {
            await prisma.refund.update({
              where: { id: updatedRefund.id },
              data: { completionNotifiedAt: new Date() },
            });
          }
        })
        .catch((e) => console.error("Error sending COD refund completion email:", e));
    }

    return NextResponse.json({
      success: true,
      message: "COD refund marked as paid and completed successfully.",
      refund: updatedRefund,
    });
  } catch (error: any) {
    console.error("POST /api/admin/refunds/[id]/complete-cod error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to complete COD refund." },
      { status: 500 }
    );
  }
}
