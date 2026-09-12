import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { verifyChapaRefund } from "@/lib/chapa";
import { sendRefundSuccessEmail, sendRefundFailedEmail } from "@/lib/email";

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
    const refund = await prisma.refund.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!refund) {
      return NextResponse.json({ error: "Refund record not found." }, { status: 404 });
    }

    const ref_id = refund.chapaRefundRef || refund.chapaTxRef;
    if (!ref_id) {
      return NextResponse.json(
        { error: "No Chapa reference ID or transaction reference available to verify." },
        { status: 400 }
      );
    }

    const chapaResult = await verifyChapaRefund(ref_id);
    console.log(`[Admin Refund Verify] Result for refund ${refund.refundNumber}:`, chapaResult);

    const chapaStatus = (chapaResult.status || "").toLowerCase();

    // If Chapa reports completed / refunded
    if (chapaResult.success && (chapaStatus === "refunded" || chapaStatus === "success")) {
      const updatedRefund = await prisma.refund.update({
        where: { id },
        data: {
          status: "REFUNDED",
          resolvedAt: new Date(),
        },
      });

      if (refund.orderId) {
        await prisma.order.update({
          where: { id: refund.orderId },
          data: { status: "REFUNDED" },
        });
      }

      if (!refund.completionNotifiedAt) {
        sendRefundSuccessEmail({
          to: updatedRefund.customerEmail,
          customerName: updatedRefund.customerName,
          refundNumber: updatedRefund.refundNumber,
          orderNumber: refund.order?.orderNumber || refund.orderId,
          amount: updatedRefund.amount,
          paymentMethod: updatedRefund.paymentMethod || "Chapa",
          chapaRefundRef: refund.chapaRefundRef || ref_id,
        })
          .then(async (res) => {
            if (res.success) {
              await prisma.refund.update({
                where: { id: updatedRefund.id },
                data: { completionNotifiedAt: new Date() },
              });
            }
          })
          .catch((e) => console.error("Error sending refund success email:", e));
      }

      return NextResponse.json({
        success: true,
        message: "Refund confirmed and marked as REFUNDED by Chapa.",
        chapaStatus,
        refund: updatedRefund,
      });
    }

    // If Chapa reports reversed
    if (chapaStatus === "reversed") {
      const updatedRefund = await prisma.refund.update({
        where: { id },
        data: {
          status: "REVERSED",
          rejectionReason: "Chapa reported transaction as reversed.",
          resolvedAt: new Date(),
        },
      });

      sendRefundFailedEmail({
        to: updatedRefund.customerEmail,
        customerName: updatedRefund.customerName,
        refundNumber: updatedRefund.refundNumber,
        orderNumber: refund.order?.orderNumber || refund.orderId,
      }).catch((e) => console.error("Error sending refund reversed email:", e));

      return NextResponse.json({
        success: true,
        message: "Chapa reported refund as REVERSED.",
        chapaStatus,
        refund: updatedRefund,
      });
    }

    // If Chapa reports failed
    if (chapaStatus === "failed" || !chapaResult.success) {
      const updatedRefund = await prisma.refund.update({
        where: { id },
        data: {
          status: "FAILED",
          rejectionReason: chapaResult.message || "Chapa verification reported failure.",
        },
      });

      return NextResponse.json({
        success: false,
        message: `Chapa reported refund status: ${chapaStatus || "failed"}`,
        chapaStatus,
        refund: updatedRefund,
      });
    }

    // Otherwise still processing
    return NextResponse.json({
      success: true,
      message: `Chapa refund status: ${chapaStatus || "processing"}`,
      chapaStatus,
      refund,
    });
  } catch (error: any) {
    console.error("POST /api/admin/refunds/[id]/verify error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify refund with Chapa." },
      { status: 500 }
    );
  }
}
