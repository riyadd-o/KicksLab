import { prisma } from "@/lib/prisma";
import { sendOrderDeliveredEmail, sendOrderCancelledEmail } from "@/lib/email";
import { generateGuestReviewToken } from "@/lib/review-token";

export interface StatusUpdateParams {
  orderId: string;
  newStatus?: string;
  internalNote?: string;
  cancelReason?: string;
}

/**
 * Centrally updates an order status, enforcing idempotency, stock replenishment on cancellation,
 * payment state safety, and triggering delivery/cancellation emails only on actual transitions.
 */
export async function transitionOrderStatus({
  orderId,
  newStatus,
  internalNote,
  cancelReason,
}: StatusUpdateParams) {
  const currentOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!currentOrder) {
    throw new Error(`Order not found with id: ${orderId}`);
  }

  const updatedData: any = {};
  if (internalNote !== undefined) updatedData.internalNote = internalNote;

  const previousStatus = currentOrder.status;
  const isStatusChanging = newStatus !== undefined && newStatus !== previousStatus;

  if (newStatus !== undefined) {
    updatedData.status = newStatus;
  }

  const isTransitioningToDelivered = isStatusChanging && newStatus === "DELIVERED";
  const isTransitioningToCancelled = isStatusChanging && newStatus === "CANCELLED";

  // If transitioning to CANCELLED:
  if (isTransitioningToCancelled) {
    // Restock ordered products safely
    for (const item of currentOrder.items) {
      if (!item.productId) continue;
      try {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      } catch (stockErr) {
        console.error(`[Stock Replenish Error] Product ${item.productId}:`, stockErr);
      }
    }

    // Payment state safety:
    // For COD orders: paymentStatus remains PENDING (no payment collected).
    // For Chapa orders: if PENDING, cancel payment. If already PAID, preserve PAID.
    const isCOD = currentOrder.paymentMethod === "CASH_ON_DELIVERY" || currentOrder.paymentMethod === "COD";
    if (!isCOD && currentOrder.paymentStatus === "PENDING") {
      updatedData.paymentStatus = "CANCELLED";
    }
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: updatedData,
    include: { items: true },
  });

  // Asynchronous email notifications on actual state transitions
  if (isTransitioningToDelivered) {
    try {
      console.log(`[Order Status Transition] Order #${updatedOrder.orderNumber} transitioned ${previousStatus} -> DELIVERED. Sending delivery email.`);

      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      let reviewUrl = `${baseUrl}/account/reviews`;

      if (!updatedOrder.userId) {
        // Guest order: generate secure, cryptographically signed, expiring review token
        const firstItem = updatedOrder.items[0];
        const guestToken = await generateGuestReviewToken({
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          email: updatedOrder.customerEmail,
          productId: firstItem?.productId || undefined,
        });
        reviewUrl = `${baseUrl}/guest/review?token=${encodeURIComponent(guestToken)}`;
      }

      const emailRes = await sendOrderDeliveredEmail({
        to: updatedOrder.customerEmail,
        name: updatedOrder.customerName,
        orderNumber: updatedOrder.orderNumber,
        items: updatedOrder.items,
        total: updatedOrder.total,
        paymentMethod: updatedOrder.paymentMethod,
        paymentStatus: updatedOrder.paymentStatus,
        reviewUrl,
      });
      if (!emailRes.success) {
        console.error(`[Delivery Email Error] Provider returned: ${emailRes.error}`);
      }
    } catch (deliveryMailErr) {
      console.error(`[Delivery Email Error] Failed to send delivery email for #${updatedOrder.orderNumber}:`, deliveryMailErr);
    }
  }

  if (isTransitioningToCancelled) {
    try {
      console.log(`[Order Status Transition] Order #${updatedOrder.orderNumber} transitioned ${previousStatus} -> CANCELLED. Sending cancellation email.`);
      const emailRes = await sendOrderCancelledEmail({
        to: updatedOrder.customerEmail,
        name: updatedOrder.customerName,
        orderNumber: updatedOrder.orderNumber,
        items: updatedOrder.items,
        total: updatedOrder.total,
        paymentStatus: updatedOrder.paymentStatus,
        paymentMethod: updatedOrder.paymentMethod,
        reason: cancelReason,
      });
      if (!emailRes.success) {
        console.error(`[Cancellation Email Error] Provider returned: ${emailRes.error}`);
      }
    } catch (cancelMailErr) {
      console.error(`[Cancellation Email Error] Failed to send cancellation email for #${updatedOrder.orderNumber}:`, cancelMailErr);
    }
  }

  return updatedOrder;
}
