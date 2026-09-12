import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import {
  sendRefundApprovedEmail,
  sendRefundRejectedEmail,
  sendRefundSuccessEmail,
  sendRefundFailedEmail,
} from "@/lib/email";
import { initiateChapaRefund, verifyChapaRefund } from "@/lib/chapa";

export async function PUT(
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
    const { status, adminNote, rejectionReason } = body;

    const normalizedStatus = typeof status === "string" ? status.toUpperCase() : "";

    const existingRefund = await prisma.refund.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!existingRefund) {
      return NextResponse.json({ error: "Refund record not found." }, { status: 404 });
    }

    const order = existingRefund.order;
    if (!order) {
      return NextResponse.json({ error: "Associated order not found." }, { status: 404 });
    }

    // ─── REJECTION FLOW ──────────────────────────────────────────
    if (normalizedStatus === "REJECTED") {
      const finalRejectionReason = rejectionReason || existingRefund.rejectionReason || "Requirements not met";

      const updatedRefund = await prisma.refund.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectionReason: finalRejectionReason,
          adminNote: adminNote !== undefined ? adminNote : existingRefund.adminNote,
          resolvedAt: new Date(),
        },
      });

      // Dispatch rejection notification idempotently
      if (!existingRefund.rejectionNotifiedAt) {
        sendRefundRejectedEmail({
          to: updatedRefund.customerEmail,
          customerName: updatedRefund.customerName,
          refundNumber: updatedRefund.refundNumber,
          rejectionReason: finalRejectionReason,
        })
          .then(async (res) => {
            if (res.success) {
              await prisma.refund.update({
                where: { id: updatedRefund.id },
                data: { rejectionNotifiedAt: new Date() },
              });
            }
          })
          .catch((e) => console.error("Error sending refund rejection email:", e));
      }

      return NextResponse.json(updatedRefund);
    }

    // ─── APPROVAL / INITIATION FLOW ──────────────────────────────
    if (normalizedStatus === "APPROVED" || normalizedStatus === "PROCESSING" || normalizedStatus === "REFUNDED") {
      // 1. Idempotency and Double-Refund Protection
      if (existingRefund.status === "REFUNDED") {
        return NextResponse.json(
          { error: "This refund has already been completed and confirmed." },
          { status: 400 }
        );
      }

      if (existingRefund.status === "PROCESSING" && existingRefund.chapaRefundRef) {
        return NextResponse.json(
          {
            error: "Refund is already in PROCESSING state with Chapa. Use status verification instead.",
            refund: existingRefund,
          },
          { status: 400 }
        );
      }

      const pm = (existingRefund.paymentMethod || order.paymentMethod || "").trim().toUpperCase();
      const isChapa = pm === "CHAPA" || pm.includes("CHAPA");
      const isCod = pm === "CASH_ON_DELIVERY" || pm === "COD" || pm.includes("CASH");

      // ─── CASH ON DELIVERY REFUND (Internal COD Lifecycle) ──────
      if (isCod) {
        let finalCodStatus: "APPROVED" | "PROCESSING" | "REFUNDED" = "APPROVED";
        if (normalizedStatus === "PROCESSING") {
          finalCodStatus = "PROCESSING";
        } else if (normalizedStatus === "REFUNDED") {
          finalCodStatus = "REFUNDED";
        } else {
          finalCodStatus = "APPROVED";
        }

        const updatedRefund = await prisma.refund.update({
          where: { id },
          data: {
            status: finalCodStatus,
            adminNote: adminNote !== undefined ? adminNote : existingRefund.adminNote,
            ...(finalCodStatus === "REFUNDED" ? { resolvedAt: new Date() } : {}),
          },
        });

        if (finalCodStatus === "REFUNDED") {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "REFUNDED" },
          });

          if (!existingRefund.completionNotifiedAt) {
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
        } else if (finalCodStatus === "APPROVED") {
          if (!existingRefund.approvalNotifiedAt) {
            sendRefundApprovedEmail({
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
              staffNote: adminNote || updatedRefund.adminNote || undefined,
            })
              .then(async (res) => {
                if (res.success) {
                  await prisma.refund.update({
                    where: { id: updatedRefund.id },
                    data: { approvalNotifiedAt: new Date() },
                  });
                }
              })
              .catch((e) => console.error("Error sending COD refund approval email:", e));
          }
        }

        return NextResponse.json(updatedRefund);
      }

      // ─── CHAPA ONLINE REFUND (Real Chapa API) ───────────────────
      if (isChapa) {
        const tx_ref = existingRefund.chapaTxRef || order.paymentReference;
        if (!tx_ref) {
          return NextResponse.json(
            { error: "Missing original Chapa transaction reference (tx_ref) on order." },
            { status: 400 }
          );
        }

        // Server-side amount validation
        const eligibleAmount = Math.min(existingRefund.amount, order.total);

        console.log(`[CHAPA REFUND ACTION]`, {
          orderNumber: order.orderNumber,
          refundNumber: existingRefund.refundNumber,
          paymentReferenceExists: Boolean(tx_ref),
          txRefLength: tx_ref?.length,
          hasChapaRefId: Boolean(order.chapaRefId),
          customerEmail: existingRefund.customerEmail || order.customerEmail,
          amount: eligibleAmount,
        });

        // Call Chapa Refund API
        const chapaRes = await initiateChapaRefund({
          tx_ref,
          chapa_reference: order.chapaRefId || null,
          amount: eligibleAmount,
          reason: existingRefund.reason || "Customer refund request",
        });

        console.log(`[Admin Refund Action] Chapa initiation result for ${existingRefund.refundNumber}:`, chapaRes);

        if (!chapaRes.success) {
          // Record failure without falsely marking REFUNDED
          await prisma.refund.update({
            where: { id },
            data: {
              status: "FAILED",
              rejectionReason: chapaRes.message || "Chapa refund rejected by gateway",
              adminNote: adminNote !== undefined ? adminNote : existingRefund.adminNote,
            },
          });

          return NextResponse.json(
            {
              error: `Chapa Refund Gateway Error: ${chapaRes.message || "Failed to process refund"}`,
              details: chapaRes.raw,
            },
            { status: 400 }
          );
        }

        const chapaRefundRef = chapaRes.ref_id || existingRefund.chapaRefundRef || `CRF-${Date.now()}`;

        // Save chapaRefId on order if not present
        if (chapaRes.chapa_reference && !order.chapaRefId) {
          await prisma.order.update({
            where: { id: order.id },
            data: { chapaRefId: chapaRes.chapa_reference },
          });
        }

        // Chapa approval transitions status to PROCESSING
        const updatedRefund = await prisma.refund.update({
          where: { id },
          data: {
            chapaRefundRef,
            chapaTxRef: tx_ref,
            status: "PROCESSING",
            adminNote: adminNote !== undefined ? adminNote : existingRefund.adminNote,
          },
        });

        // Send ONLY the Approval email on approval action
        if (!existingRefund.approvalNotifiedAt) {
          sendRefundApprovedEmail({
            to: updatedRefund.customerEmail,
            customerName: updatedRefund.customerName,
            refundNumber: updatedRefund.refundNumber,
            orderNumber: order.orderNumber,
            amount: updatedRefund.amount,
            paymentMethod: "Chapa",
            staffNote: adminNote || updatedRefund.adminNote || undefined,
          })
            .then(async (res) => {
              if (res.success) {
                await prisma.refund.update({
                  where: { id: updatedRefund.id },
                  data: { approvalNotifiedAt: new Date() },
                });
              }
            })
            .catch((e) => console.error("Error sending refund approved email:", e));
        }

        return NextResponse.json(updatedRefund);
      }
    }

    // Default fallback update for admin notes
    const genericUpdate = await prisma.refund.update({
      where: { id },
      data: {
        ...(adminNote !== undefined ? { adminNote } : {}),
      },
    });

    return NextResponse.json(genericUpdate);
  } catch (error: any) {
    console.error("PUT /api/admin/refunds/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process refund update." },
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
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { id } = await params;

    await prisma.refund.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Refund record deleted." });
  } catch (error: any) {
    console.error("DELETE /api/admin/refunds/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete refund." },
      { status: 500 }
    );
  }
}
