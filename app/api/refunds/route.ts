import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, reason, description, source } = body;

    if (!orderId || !reason) {
      return NextResponse.json({ error: "Order ID and reason are required." }, { status: 400 });
    }

    let order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      order = await prisma.order.findUnique({
        where: { orderNumber: orderId }
      });
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Email ownership validation if email provided
    const clientEmail = body.email ? String(body.email).trim().toLowerCase() : null;
    if (clientEmail && order.customerEmail.toLowerCase() !== clientEmail) {
      return NextResponse.json(
        { error: "Email does not match the order record." },
        { status: 403 }
      );
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot request a refund for a cancelled order." },
        { status: 400 }
      );
    }

    if (order.status === "REFUNDED") {
      return NextResponse.json(
        { error: "This order has already been refunded." },
        { status: 400 }
      );
    }

    const eligibleStatuses = ["PENDING", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"];
    if (!eligibleStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: `Refund requests cannot be submitted for orders with status '${order.status}'.` },
        { status: 400 }
      );
    }

    // COD orders: Allow refund requests if delivered or already marked as paid, and require refund payout destination
    const pm = (order.paymentMethod || "").trim().toUpperCase();
    const isCOD = pm === "CASH_ON_DELIVERY" || pm === "COD" || pm.includes("CASH");
    if (isCOD && order.status !== "DELIVERED" && order.paymentStatus !== "PAID") {
      return NextResponse.json(
        { error: "For active Cash on Delivery orders prior to delivery, please use 'Cancel Order'. Refund requests become available once the order has been delivered." },
        { status: 400 }
      );
    }

    let validRefundMethod: string | null = null;
    let validRefundAccountName: string | null = null;
    let validRefundAccountNumber: string | null = null;
    let validRefundPhoneNumber: string | null = null;

    if (isCOD) {
      const { refundMethod, refundAccountName, refundAccountNumber, refundPhoneNumber } = body;

      const normMethod = typeof refundMethod === "string" ? refundMethod.trim().toUpperCase() : "";
      const validMethods = ["TELEBIRR", "CBE", "EBIRR", "AWASH_BIRR"];

      if (!normMethod || !validMethods.includes(normMethod)) {
        return NextResponse.json(
          { error: "Please select a valid refund method (Telebirr, CBE, eBirr, or Awash Birr)." },
          { status: 400 }
        );
      }

      if (!refundAccountName || typeof refundAccountName !== "string" || !refundAccountName.trim()) {
        return NextResponse.json(
          { error: "Account holder name is required for the refund destination." },
          { status: 400 }
        );
      }

      validRefundMethod = normMethod;
      validRefundAccountName = refundAccountName.trim();

      if (normMethod === "CBE") {
        if (!refundAccountNumber || typeof refundAccountNumber !== "string" || !refundAccountNumber.trim()) {
          return NextResponse.json(
            { error: "CBE Account Number is required." },
            { status: 400 }
          );
        }
        validRefundAccountNumber = refundAccountNumber.trim();
        validRefundPhoneNumber = null; // Do not allow cross-method data
      } else {
        // Mobile Money (Telebirr, eBirr, Awash Birr)
        if (!refundPhoneNumber || typeof refundPhoneNumber !== "string" || !refundPhoneNumber.trim()) {
          const methodName = normMethod === "TELEBIRR" ? "Telebirr" : normMethod === "EBIRR" ? "eBirr" : "Awash Birr";
          return NextResponse.json(
            { error: `${methodName} Phone Number is required.` },
            { status: 400 }
          );
        }
        const cleanPhone = refundPhoneNumber.trim().replace(/[\s-]/g, "");
        if (cleanPhone.length < 9) {
          return NextResponse.json(
            { error: "Please provide a valid mobile money phone number." },
            { status: 400 }
          );
        }
        validRefundPhoneNumber = cleanPhone;
        validRefundAccountNumber = null; // Do not allow cross-method data
      }
    }

    // Check if refund already exists
    const existingRefund = await prisma.refund.findUnique({
      where: { orderId: order.id }
    });

    if (existingRefund) {
      return NextResponse.json(
        { error: "A refund request already exists for this order.", refund: existingRefund },
        { status: 400 }
      );
    }

    const refundNumber = "RF-" + Math.floor(100000 + Math.random() * 900000);

    const refund = await prisma.refund.create({
      data: {
        refundNumber,
        orderId: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        paymentMethod: order.paymentMethod,
        amount: order.total,
        reason,
        description,
        source: source || "track-order",
        chapaTxRef: order.paymentReference || null,
        refundMethod: validRefundMethod,
        refundAccountName: validRefundAccountName,
        refundAccountNumber: validRefundAccountNumber,
        refundPhoneNumber: validRefundPhoneNumber,
        status: "PENDING"
      }
    });

    return NextResponse.json({ success: true, refund }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/refunds error:", error);
    return NextResponse.json({ error: error.message || "Failed to create refund request." }, { status: 500 });
  }
}
