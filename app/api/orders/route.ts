import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession, getAdminSession } from "@/lib/session";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { calculateDropPrice } from "@/lib/promotions";

export const dynamic = "force-dynamic";

const inFlightOrders = new Map<string, Promise<any>>();

function generateOrderNumber() {
  return "KL-" + Math.floor(100000 + Math.random() * 900000);
}

export async function POST(req: NextRequest) {
  try {
    const customerSession = await getCustomerSession(req);
    const body = await req.json();

    const {
      customerName, customerEmail, customerPhone,
      streetAddress, city,
      items, paymentMethod, couponCode, shippingZoneId, shippingZoneName,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item." }, { status: 400 });
    }

    // Canonical customer identity resolution for authenticated users
    let userId: string | null = null;
    let finalCustomerEmail = typeof customerEmail === "string" ? customerEmail.trim().toLowerCase() : "";
    let finalCustomerName = typeof customerName === "string" ? customerName.trim() : "";

    if (customerSession?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: customerSession.id },
        select: { id: true, email: true, name: true },
      });
      if (dbUser) {
        userId = dbUser.id;
        finalCustomerEmail = dbUser.email;
        if (!finalCustomerName) finalCustomerName = dbUser.name;
      }
    }

    if (!finalCustomerEmail) {
      return NextResponse.json({ error: "A valid customer email is required." }, { status: 400 });
    }

    // Payment method validation for direct checkout
    let canonicalPaymentMethod = "CASH";
    const canonicalPaymentProvider = "NONE";
    if (paymentMethod) {
      const norm = String(paymentMethod).trim().toUpperCase();
      if (norm === "CASH" || norm === "CASH_ON_DELIVERY" || norm === "COD") {
        canonicalPaymentMethod = "CASH";
      } else {
        return NextResponse.json(
          { error: "Direct order submission is only valid for Cash payments. Digital payments must use the payment gateway flow." },
          { status: 400 }
        );
      }
    }

    // 1. Calculate server subtotal from database product prices & active drop discounts
    const validProductIds = items
      .map((i: any) => i.productId || i.id)
      .filter((id: any) => typeof id === "string" && id.trim().length > 0);

    const dbProducts = validProductIds.length > 0 
      ? await prisma.product.findMany({
          where: {
            OR: [
              { id: { in: validProductIds } },
              { slug: { in: validProductIds } }
            ]
          },
        })
      : [];

    const now = new Date();
    const activeDrops = dbProducts.length > 0
      ? await prisma.limitedDrop.findMany({
          where: {
            isActive: true,
            startDate: { lte: now },
            endDate: { gt: now },
            products: {
              some: {
                productId: { in: dbProducts.map((p) => p.id) },
              },
            },
          },
          include: {
            products: true,
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

    let serverSubtotal = 0;
    const validatedItems = items.map((item: any) => {
      const targetId = item.productId || item.id;
      const product = dbProducts.find((p) => p.id === targetId || p.slug === targetId);
      let price = product ? product.price : item.price;

      if (product) {
        const dropForProduct = activeDrops.find((drop) =>
          drop.products.some((dp) => dp.productId === product.id)
        );
        if (dropForProduct) {
          price = calculateDropPrice(product.price, dropForProduct.discountType, dropForProduct.discountValue);
        }
      }

      const itemSubtotal = price * item.quantity;
      serverSubtotal += itemSubtotal;
      return {
        productId: product ? product.id : targetId,
        name:      product ? product.name : item.name,
        image:     (product && product.images && product.images.length > 0) ? product.images[0] : (item.image || ""),
        size:      String(item.size ?? (product && product.sizes && product.sizes.length > 0 ? product.sizes[0] : "Standard")),
        quantity:  item.quantity,
        price,
      };
    });

    // Validate server-side product stock before proceeding
    for (const item of validatedItems) {
      const product = dbProducts.find((p) => p.id === item.productId || p.slug === item.productId);
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.name}` }, { status: 400 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${product.name}". Only ${product.stock} left in stock.` },
          { status: 400 }
        );
      }
    }

    // 2. Validate coupon and calculate discount
    let couponDiscountAmount = 0;
    let couponDiscountPercent: number | null = null;
    let validCouponCode: string | null = null;
    let appliedCoupon: any = null;

    if (couponCode) {
      const normalizedCoupon = String(couponCode).trim().toUpperCase();
      const coupon = await prisma.coupon.findUnique({
        where: { code: normalizedCoupon },
      });

      if (!coupon || !coupon.active) {
        return NextResponse.json({ error: "Invalid or inactive coupon code." }, { status: 400 });
      }

      if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
        return NextResponse.json({ error: "Invalid or expired coupon code." }, { status: 400 });
      }

      if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit) {
        return NextResponse.json({ error: "This coupon has reached its total usage limit." }, { status: 400 });
      }

      if (coupon.perCustomerLimit !== null && coupon.perCustomerLimit !== undefined) {
        if (!userId) {
          return NextResponse.json({ error: "Please sign in to your account to use this coupon." }, { status: 401 });
        }

        const customerUses = (prisma as any).couponUsage ? await prisma.couponUsage.count({
          where: { couponId: coupon.id, userId }
        }) : 0;

        if (customerUses >= coupon.perCustomerLimit) {
          return NextResponse.json({ error: "You have already used this coupon." }, { status: 400 });
        }
      }

      if (coupon.minOrder !== null && coupon.minOrder > 0 && serverSubtotal < coupon.minOrder) {
        return NextResponse.json({
          error: `Minimum order amount for this coupon is ETB ${coupon.minOrder.toLocaleString()}.`
        }, { status: 400 });
      }

      appliedCoupon = coupon;
      validCouponCode = coupon.code;
      if (coupon.discountType === "percentage") {
        couponDiscountPercent = coupon.value;
        couponDiscountAmount = Math.round(serverSubtotal * (coupon.value / 100));
      } else {
        couponDiscountAmount = Math.min(coupon.value, serverSubtotal);
        couponDiscountPercent = Math.round((couponDiscountAmount / serverSubtotal) * 100);
      }
    }

    const qualifyingSubtotal = Math.max(0, serverSubtotal - couponDiscountAmount);

    // 3. Determine shipping fee from database shipping settings and selected zone
    let shippingSettings = await prisma.shippingSettings.findUnique({
      where: { id: "singleton" },
    });
    if (!shippingSettings) {
      shippingSettings = {
        id: "singleton",
        freeShippingEnabled: true,
        freeShippingThreshold: 5000,
      };
    }

    let selectedZone = null;
    if (shippingZoneId) {
      selectedZone = await prisma.shippingZone.findUnique({
        where: { id: shippingZoneId },
      });
    }

    if (!selectedZone && (shippingZoneName || city)) {
      const searchTarget = shippingZoneName || city;
      selectedZone = await prisma.shippingZone.findFirst({
        where: {
          OR: [
            { name: { equals: searchTarget, mode: "insensitive" } },
            { city: { equals: searchTarget, mode: "insensitive" } },
          ],
          active: true,
        },
      });
    }

    if (!selectedZone) {
      selectedZone = await prisma.shippingZone.findFirst({
        where: { active: true },
        orderBy: { createdAt: "asc" },
      });
    }

    const zoneFee = selectedZone ? selectedZone.fee : 100;
    const zoneName = selectedZone ? selectedZone.name : (city || "Standard Shipping");

    let serverShippingCost = zoneFee;
    if (
      shippingSettings.freeShippingEnabled &&
      qualifyingSubtotal >= shippingSettings.freeShippingThreshold
    ) {
      serverShippingCost = 0;
    }

    const serverTotal = serverSubtotal - couponDiscountAmount + serverShippingCost;

    // Server-side double submission / idempotency guard (4s window)
    const idempotencyKey = `${finalCustomerEmail}:${Math.round(serverTotal)}:${canonicalPaymentMethod}`;
    if (inFlightOrders.has(idempotencyKey)) {
      try {
        const pendingOrder = await inFlightOrders.get(idempotencyKey);
        return NextResponse.json(pendingOrder, { status: 200 });
      } catch (err) {
        // If the in-flight failed, let this request attempt creation
      }
    }

    const recentDuplicate = await prisma.order.findFirst({
      where: {
        customerEmail: finalCustomerEmail,
        createdAt: { gte: new Date(Date.now() - 4000) },
        total: serverTotal,
      },
      include: { items: true },
    });
    if (recentDuplicate) {
      return NextResponse.json(recentDuplicate, { status: 200 });
    }

    // Atomically decrement stock and create the order with compensating rollback
    const creationPromise = (async () => {
      const updatedProducts: { id: string; quantity: number }[] = [];
      try {
        for (const item of validatedItems) {
          const updateResult = await prisma.product.updateMany({
            where: {
              id: item.productId,
              stock: { gte: item.quantity },
            },
            data: {
              stock: { decrement: item.quantity },
            },
          });
          if (updateResult.count === 0) {
            throw new Error(`Insufficient stock for "${item.name}". Please adjust your cart.`);
          }
          updatedProducts.push({ id: item.productId, quantity: item.quantity });
        }

        // Concurrency check for coupon limits before committing
        if (appliedCoupon) {
          if (appliedCoupon.usageLimit !== null && appliedCoupon.usageLimit !== undefined) {
            const currentCoupon = await prisma.coupon.findUnique({
              where: { id: appliedCoupon.id },
              select: { usageCount: true, usageLimit: true },
            });
            if (currentCoupon && currentCoupon.usageLimit !== null && currentCoupon.usageCount >= currentCoupon.usageLimit) {
              throw new Error("This coupon has reached its total usage limit.");
            }
          }

          if (appliedCoupon.perCustomerLimit !== null && appliedCoupon.perCustomerLimit !== undefined && userId) {
            const currentUses = (prisma as any).couponUsage ? await prisma.couponUsage.count({
              where: { couponId: appliedCoupon.id, userId },
            }) : 0;
            if (currentUses >= appliedCoupon.perCustomerLimit) {
              throw new Error("You have already used this coupon.");
            }
          }
        }

        const createdOrder = await prisma.order.create({
          data: {
            orderNumber:    generateOrderNumber(),
            userId,
            customerName:   finalCustomerName,
            customerEmail:  finalCustomerEmail,
            customerPhone,
            streetAddress,
            city,
            subtotal:       serverSubtotal,
            shippingZone:   zoneName,
            shippingMethod: zoneName,
            shippingCost:   serverShippingCost,
            total:          serverTotal,
            paymentMethod:  canonicalPaymentMethod,
            paymentProvider: canonicalPaymentProvider,
            paymentStatus:  "PENDING",
            couponCode:     validCouponCode,
            couponDiscount: couponDiscountPercent,
            status:         "PENDING",
            items: {
              create: validatedItems,
            },
          },
          include: { items: true },
        });

        // Increment coupon usage and record CouponUsage
        if (appliedCoupon) {
          await prisma.coupon.update({
            where:  { id: appliedCoupon.id },
            data:   { usageCount: { increment: 1 } },
          });

          if (userId && (prisma as any).couponUsage) {
            await prisma.couponUsage.create({
              data: {
                couponId: appliedCoupon.id,
                userId,
                orderId: createdOrder.id,
              }
            }).catch((err) => {
              console.error("[Coupon Usage Record Error]:", err);
            });
          }
        }

        return createdOrder;
      } catch (err) {
        // Compensating rollback for any items decremented before failure
        for (const p of updatedProducts) {
          await prisma.product.updateMany({
            where: { id: p.id },
            data: { stock: { increment: p.quantity } },
          }).catch(() => {});
        }
        throw err;
      }
    })();

    inFlightOrders.set(idempotencyKey, creationPromise);
    let order;
    try {
      order = await creationPromise;
    } finally {
      setTimeout(() => inFlightOrders.delete(idempotencyKey), 4000);
    }

    // Safely send confirmation email via Gmail SMTP without failing order creation
    try {
      const emailRes = await sendOrderConfirmationEmail({
        to:             finalCustomerEmail,
        name:           finalCustomerName,
        orderNumber:    order.orderNumber,
        items:          order.items,
        subtotal:       serverSubtotal,
        couponDiscount: couponDiscountPercent,
        shippingCost:   serverShippingCost,
        total:          serverTotal,
        paymentMethod:  canonicalPaymentMethod,
        paymentStatus:  order.paymentStatus,
        orderStatus:    order.status,
      });

      if (emailRes.success) {
        await prisma.order.update({
          where: { id: order.id },
          data: { confirmationEmailSentAt: new Date() },
        });
      } else {
        console.error(`[Order Email Error] Email provider rejected confirmation email for order ${order.orderNumber} to ${finalCustomerEmail}:`, emailRes.error);
      }
    } catch (mailErr: any) {
      console.error(`[Order Email Error] Failed to send order confirmation email for ${order.orderNumber}:`, mailErr.message || mailErr);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order." },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumberParam = searchParams.get("orderNumber");
    const withMetrics = searchParams.get("metrics") === "true";

    if (orderNumberParam) {
      const order = await prisma.order.findUnique({
        where: { orderNumber: orderNumberParam },
        include: { items: true },
      });
      if (order) return NextResponse.json(order);
    }

    const adminSession = await getAdminSession(req);
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    if (withMetrics && adminSession) {
      const [totalOrders, pendingOrders, productsCount, revenueAggregate] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.product.count(),
        prisma.order.aggregate({
          where: {
            status: { notIn: ["CANCELLED", "REFUNDED"] },
            paymentStatus: "PAID",
          },
          _sum: { total: true },
        }),
      ]);

      return NextResponse.json({
        orders,
        metrics: {
          totalOrders,
          totalRevenue: revenueAggregate._sum.total || 0,
          products: productsCount,
          pendingOrders,
        },
      });
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Fetch orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}
