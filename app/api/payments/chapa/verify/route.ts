import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email";

async function verifyAndProcessOrder(tx_ref: string) {
  const order = await prisma.order.findUnique({
    where: { paymentReference: tx_ref },
    include: { items: true },
  });

  if (!order) {
    console.error(`[Chapa Verify Error] Order not found for tx_ref: ${tx_ref}`);
    return { success: false, error: "Order not found", order: null };
  }

  // Idempotency check: If already paid, return early with success and retry email if needed
  if (order.paymentStatus === "PAID") {
    console.log(`[Chapa Verify] Order ${order.orderNumber} already marked as PAID.`);

    if (!order.confirmationEmailSentAt) {
      try {
        console.log(`[Order Email] Retrying confirmation email for PAID order ${order.orderNumber}`);
        console.log(`[Order Email] Customer: ${order.customerEmail}`);

        const emailRes = await sendOrderConfirmationEmail({
          to: order.customerEmail,
          name: order.customerName,
          orderNumber: order.orderNumber,
          orderDate: order.paidAt || order.createdAt,
          shippingAddress: `${order.streetAddress}, ${order.city}`,
          items: order.items,
          subtotal: order.subtotal,
          couponDiscount: order.couponDiscount,
          shippingCost: order.shippingCost,
          total: order.total,
          paymentMethod: order.paymentMethod || "Telebirr",
          paymentStatus: "PAID",
          paymentReference: order.chapaRefId || order.paymentReference,
          orderStatus: order.status || "PROCESSING",
        });

        if (emailRes.success) {
          console.log(`[Order Email] Gmail SMTP retry success. Email ID: ${emailRes.id}`);
          await prisma.order.update({
            where: { id: order.id },
            data: { confirmationEmailSentAt: new Date() },
          });
          console.log(`[Order Email] confirmationEmailSentAt saved for order ${order.orderNumber}`);
        } else {
          console.error(`[Order Email] Gmail SMTP rejected order confirmation retry for ${order.orderNumber}:`, emailRes.error);
        }
      } catch (emailErr) {
        console.error(`[Order Email] Retry email sending failed for order ${order.orderNumber}:`, emailErr);
      }
    }

    return { success: true, order, alreadyPaid: true };
  }

  // Verify transaction with Chapa Server API
  const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
  if (!chapaSecretKey) {
    console.error("[Chapa Configuration Error] CHAPA_SECRET_KEY is not configured in environment variables.");
    return {
      success: false,
      error: "Server configuration error: CHAPA_SECRET_KEY missing.",
      order,
    };
  }

  const chapaRes = await fetch(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${chapaSecretKey}`,
    },
  });

  const chapaContentType = chapaRes.headers.get("content-type") || "";
  let chapaData: any = {};
  if (chapaContentType.includes("application/json")) {
    chapaData = await chapaRes.json();
  } else {
    const text = await chapaRes.text();
    console.error(`[Chapa Verify Error] Chapa returned non-JSON response for tx_ref ${tx_ref}:`, text);
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED" },
    });
    return {
      success: false,
      error: "Verification failed: Invalid response from Chapa API.",
      order,
    };
  }

  console.log(`[Chapa Verify Response] tx_ref: ${tx_ref}`, chapaData);

  if (!chapaRes.ok || chapaData.status !== "success" || !chapaData.data) {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED" },
    });
    return {
      success: false,
      error: typeof chapaData.message === "string" ? chapaData.message : "Chapa transaction verification failed.",
      order,
    };
  }

  const { status, amount, currency, tx_ref: returnedTxRef } = chapaData.data;

  // Strict verification checks
  const isStatusSuccess = status === "success";
  const isAmountMatch = Math.abs(Number(amount) - Number(order.total)) < 0.01;
  const isCurrencyMatch = currency === "ETB";
  const isRefMatch = returnedTxRef === order.paymentReference;

  if (!isStatusSuccess || !isAmountMatch || !isCurrencyMatch || !isRefMatch) {
    console.error(`[Chapa Security Mismatch] Order ${order.orderNumber}:`, {
      isStatusSuccess,
      isAmountMatch,
      isCurrencyMatch,
      isRefMatch,
      expected: { amount: order.total, currency: "ETB", ref: order.paymentReference },
      actual: { amount, currency, ref: returnedTxRef, status },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED" },
    });

    return {
      success: false,
      error: "Payment verification failed security checks (amount/currency mismatch).",
      order,
    };
  }

  const chapaOfficialRef =
    chapaData.data.reference ||
    chapaData.data.chapa_reference ||
    chapaData.data.ref_id ||
    chapaData.data.id ||
    null;

  // Update Payment Status to PAID, Order Status to PROCESSING, and save official Chapa reference ID
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "PAID",
      status: "PROCESSING",
      paidAt: new Date(),
      ...(chapaOfficialRef ? { chapaRefId: String(chapaOfficialRef) } : {}),
    },
    include: { items: true },
  });

  // Safely & idempotently decrement product stock
  for (const item of order.items) {
    if (!item.productId) continue;
    try {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    } catch (err) {
      console.error(`[Stock Decrement Error] Failed for product ${item.productId}:`, err);
    }
  }

  // Safely & idempotently record coupon usage if order used a coupon
  if (order.couponCode) {
    try {
      const coupon = await prisma.coupon.findUnique({
        where: { code: order.couponCode.toUpperCase() }
      });
      if (coupon) {
        // Check if usage for this order was already recorded
        const existingUsage = await prisma.couponUsage.findUnique({
          where: {
            couponId_orderId: {
              couponId: coupon.id,
              orderId: order.id,
            }
          }
        });

        if (!existingUsage) {
          await prisma.coupon.update({
            where: { id: coupon.id },
            data: { usageCount: { increment: 1 } }
          });

          if (order.userId) {
            await prisma.couponUsage.create({
              data: {
                couponId: coupon.id,
                userId: order.userId,
                orderId: order.id,
              }
            });
          }
        }
      }
    } catch (couponErr) {
      console.error(`[Coupon Usage Verification Error] Failed for order ${order.orderNumber}:`, couponErr);
    }
  }

  // Send confirmation email asynchronously & idempotently
  if (!order.confirmationEmailSentAt && !(updatedOrder as any).confirmationEmailSentAt) {
    try {
      console.log(`[Order Email] Attempting confirmation email for order ${order.orderNumber}`);
      console.log(`[Order Email] Customer: ${order.customerEmail}`);

      const emailRes = await sendOrderConfirmationEmail({
        to: order.customerEmail,
        name: order.customerName,
        orderNumber: order.orderNumber,
        orderDate: updatedOrder.paidAt || order.createdAt,
        shippingAddress: `${order.streetAddress}, ${order.city}`,
        items: order.items,
        subtotal: order.subtotal,
        couponDiscount: order.couponDiscount,
        shippingCost: order.shippingCost,
        total: order.total,
        paymentMethod: order.paymentMethod || "Telebirr",
        paymentStatus: "PAID",
        paymentReference: (updatedOrder as any).chapaRefId || updatedOrder.paymentReference || chapaOfficialRef,
        orderStatus: "PROCESSING",
      });

      if (emailRes.success) {
        console.log(`[Order Email] Gmail SMTP success. Email ID: ${emailRes.id}`);
        // Store timestamp of successful email delivery ONLY when Gmail SMTP accepts the email
        await prisma.order.update({
          where: { id: order.id },
          data: { confirmationEmailSentAt: new Date() },
        });
        console.log(`[Order Email] confirmationEmailSentAt saved for order ${order.orderNumber}`);
      } else {
        console.error(`[Order Email] Gmail SMTP failed for order ${order.orderNumber}`);
        console.error(`[Order Email] Error:`, emailRes.error);
      }
    } catch (emailErr) {
      console.error(`[Order Email] Failed sending order confirmation email for order ${order.orderNumber}:`, emailErr);
    }
  } else {
    console.log(`[Order Email] Confirmation email already sent for order ${order.orderNumber}. Skipping duplicate.`);
  }

  return { success: true, order: updatedOrder, alreadyPaid: false };
}

// GET Handler (Browser return_url redirect)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tx_ref = searchParams.get("tx_ref") || searchParams.get("trx_ref");

  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`;

  if (!tx_ref) {
    return NextResponse.redirect(`${baseUrl}/checkout?error=missing_reference`);
  }

  try {
    const result = await verifyAndProcessOrder(tx_ref);

    if (result.success && result.order) {
      const chapaRefToPass = (result.order as any).chapaRefId || result.order.paymentReference || tx_ref;
      return NextResponse.redirect(
        `${baseUrl}/checkout?step=3&orderNumber=${result.order.orderNumber}&paymentStatus=PAID&ref=${encodeURIComponent(chapaRefToPass)}&total=${result.order.total}`
      );
    } else {
      const orderNum = result.order ? result.order.orderNumber : "";
      return NextResponse.redirect(
        `${baseUrl}/checkout?step=1&error=${encodeURIComponent(
          result.error || "Payment verification failed"
        )}&orderNumber=${orderNum}`
      );
    }
  } catch (err: any) {
    console.error("[Chapa GET Verify Route Error]", err);
    return NextResponse.redirect(
      `${baseUrl}/checkout?error=${encodeURIComponent(err.message || "Payment verification error")}`
    );
  }
}

// POST Handler (Chapa Webhook callback)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tx_ref = body.tx_ref || body.trx_ref;

    if (!tx_ref) {
      return NextResponse.json({ error: "Missing tx_ref" }, { status: 400 });
    }

    const result = await verifyAndProcessOrder(tx_ref);
    if (result.success) {
      return NextResponse.json({ status: "success", message: "Transaction verified successfully." });
    } else {
      return NextResponse.json({ status: "failed", error: result.error }, { status: 400 });
    }
  } catch (err: any) {
    console.error("[Chapa POST Verify Webhook Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
