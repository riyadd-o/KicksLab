import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendRefundSuccessEmail, sendRefundFailedEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    console.log("[Chapa Webhook Received]", body);

    const event = body.event || body.type;
    const tx_ref = body.tx_ref || body.trx_ref || body.data?.tx_ref || body.data?.trx_ref;
    const ref_id = body.ref_id || body.reference || body.data?.ref_id || body.data?.reference || body.data?.id;
    const eventStatus = (body.status || body.data?.status || "").toLowerCase();

    if (!tx_ref && !ref_id) {
      return NextResponse.json({ error: "Missing tx_ref or ref_id in webhook payload." }, { status: 400 });
    }

    // Find refund record
    let refund = null;
    if (ref_id) {
      refund = await prisma.refund.findFirst({
        where: { chapaRefundRef: String(ref_id) },
        include: { order: true },
      });
    }

    if (!refund && tx_ref) {
      refund = await prisma.refund.findFirst({
        where: {
          OR: [
            { chapaTxRef: String(tx_ref) },
            { order: { paymentReference: String(tx_ref) } },
          ],
        },
        include: { order: true },
      });
    }

    if (!refund) {
      console.log(`[Chapa Webhook] No matching refund record found for tx_ref: ${tx_ref}, ref_id: ${ref_id}`);
      return NextResponse.json({ status: "acknowledged", message: "No matching refund record." });
    }

    const isRefundCompleted =
      event === "charge.refunded" ||
      event === "refund.success" ||
      eventStatus === "refunded" ||
      eventStatus === "success";

    const isRefundReversed =
      event === "charge.reversed" ||
      eventStatus === "reversed";

    if (isRefundCompleted) {
      if (refund.status === "REFUNDED") {
        console.log(`[Chapa Webhook] Refund ${refund.refundNumber} already REFUNDED. Skipping.`);
        return NextResponse.json({ status: "success", message: "Already refunded." });
      }

      const updatedRefund = await prisma.refund.update({
        where: { id: refund.id },
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
          .catch((e) => console.error("Error sending webhook refund success email:", e));
      }

      return NextResponse.json({ status: "success", message: "Refund marked as REFUNDED." });
    }

    if (isRefundReversed) {
      await prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: "REVERSED",
          rejectionReason: "Chapa webhook reported transaction reversal.",
          resolvedAt: new Date(),
        },
      });

      sendRefundFailedEmail({
        to: refund.customerEmail,
        customerName: refund.customerName,
        refundNumber: refund.refundNumber,
        orderNumber: refund.order?.orderNumber || refund.orderId,
      }).catch((e) => console.error("Error sending webhook refund reversed email:", e));

      return NextResponse.json({ status: "success", message: "Refund marked as REVERSED." });
    }

    return NextResponse.json({ status: "acknowledged", message: "Event processed." });
  } catch (error: any) {
    console.error("[Chapa Webhook Error]", error);
    return NextResponse.json({ error: error.message || "Webhook processing error." }, { status: 500 });
  }
}
