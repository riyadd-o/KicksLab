import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/session";
import { calculateDropPrice } from "@/lib/promotions";

function generateOrderNumber() {
  return "KL-" + Math.floor(100000 + Math.random() * 900000);
}

export async function POST(req: NextRequest) {
  try {
    const customerSession = await getCustomerSession(req);
    const body = await req.json();

    const {
      customerName,
      customerEmail,
      customerPhone,
      streetAddress,
      city,
      items,
      couponCode,
      shippingZoneId,
      shippingZoneName,
    } = body;

    // Canonical customer resolution
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

    if (!finalCustomerEmail || !finalCustomerName || !streetAddress || !city) {
      return NextResponse.json(
        { error: "Missing required customer details (name, email, address, city)." },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item." }, { status: 400 });
    }

    // 1. Calculate server subtotal directly from database product prices & check stock
    const validProductIds = items
      .map((i: any) => i.productId || i.id)
      .filter((id: any) => typeof id === "string" && id.trim().length > 0);

    console.log(`[Chapa Init] Processing ${items.length} item(s). Validated Product IDs:`, validProductIds);

    if (validProductIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid product information provided in order items." },
        { status: 400 }
      );
    }

    const dbProducts = await prisma.product.findMany({
      where: {
        OR: [
          { id: { in: validProductIds } },
          { slug: { in: validProductIds } }
        ]
      },
    });

    console.log(`[Chapa Init] Database query returned ${dbProducts.length} matching product(s) for ${validProductIds.length} requested ID(s).`);

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
    const validatedItems = [];

    for (const item of items) {
      const targetId = item.productId || item.id;
      const product = dbProducts.find((p) => p.id === targetId || p.slug === targetId);
      
      if (!product) {
        console.warn(`[Chapa Init Warning] Product not found in database for ID/Slug: ${targetId}`);
        return NextResponse.json(
          { error: `Product not found: ${item.name || targetId}` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        console.warn(`[Chapa Init Warning] Insufficient stock for ${product.name}. Requested: ${item.quantity}, Stock: ${product.stock}`);
        return NextResponse.json(
          { error: `Insufficient stock for product ${product.name}. Available: ${product.stock}` },
          { status: 400 }
        );
      }

      let price = product.price;
      const dropForProduct = activeDrops.find((drop) =>
        drop.products.some((dp) => dp.productId === product.id)
      );
      if (dropForProduct) {
        price = calculateDropPrice(product.price, dropForProduct.discountType, dropForProduct.discountValue);
      }

      const itemSubtotal = price * item.quantity;
      serverSubtotal += itemSubtotal;

      validatedItems.push({
        productId: product.id,
        name: product.name,
        image: (product && product.images && product.images.length > 0) ? product.images[0] : (item.image || ""),
        size: String(item.size ?? (product && product.sizes && product.sizes.length > 0 ? product.sizes[0] : "Standard")),
        quantity: item.quantity,
        price,
      });
    }

    // 2. Validate coupon and calculate discount
    let couponDiscountAmount = 0;
    let couponDiscountPercent: number | null = null;
    let validCouponCode: string | null = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: String(couponCode).toUpperCase() },
      });
      
      const isExpired = coupon?.expiry ? new Date(coupon.expiry) < new Date() : false;
      const isLimitReached = coupon?.usageLimit !== null && coupon?.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit;
      let isCustomerLimitReached = false;
      if (coupon && coupon.perCustomerLimit !== null && coupon.perCustomerLimit !== undefined) {
        if (!userId) {
          isCustomerLimitReached = true;
        } else {
          const customerUses = await prisma.couponUsage.count({
            where: { couponId: coupon.id, userId }
          });
          if (customerUses >= coupon.perCustomerLimit) {
            isCustomerLimitReached = true;
          }
        }
      }
      const isMinOrderMet = coupon?.minOrder ? serverSubtotal >= coupon.minOrder : true;

      if (coupon && coupon.active && !isExpired && !isLimitReached && !isCustomerLimitReached && isMinOrderMet) {
        validCouponCode = coupon.code;
        if (coupon.discountType === "percentage") {
          couponDiscountPercent = coupon.value;
          couponDiscountAmount = Math.round(serverSubtotal * (coupon.value / 100));
        } else {
          couponDiscountAmount = Math.min(coupon.value, serverSubtotal);
          couponDiscountPercent = Math.round((couponDiscountAmount / serverSubtotal) * 100);
        }
      } else {
        console.warn(`[Chapa Init] Coupon ${couponCode} rejected during checkout validation.`);
      }
    }

    const qualifyingSubtotal = Math.max(0, serverSubtotal - couponDiscountAmount);

    // 3. Enforce Shipping Location Selection & calculate shipping fee
    if (!shippingZoneId && !shippingZoneName && !city) {
      return NextResponse.json(
        { error: "Please select a shipping location." },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: "Please select a shipping location." },
        { status: 400 }
      );
    }

    const zoneFee = selectedZone.fee;
    const zoneName = selectedZone.name;

    let serverShippingCost = zoneFee;
    if (
      shippingSettings.freeShippingEnabled &&
      qualifyingSubtotal >= shippingSettings.freeShippingThreshold
    ) {
      serverShippingCost = 0;
    }

    const serverTotal = serverSubtotal - couponDiscountAmount + serverShippingCost;

    // 4. Generate Order Number & Transaction Reference
    const orderNumber = generateOrderNumber();
    const tx_ref = `${orderNumber}-${Date.now()}`;

    // 5. Create Pending Order in DB
    const order = await prisma.order.create({
      data: {
        userId,
        orderNumber,
        customerName: finalCustomerName,
        customerEmail: finalCustomerEmail,
        customerPhone,
        streetAddress,
        city,
        subtotal: serverSubtotal,
        shippingZone: zoneName,
        shippingMethod: zoneName,
        shippingCost: serverShippingCost,
        total: serverTotal,
        paymentMethod: "Chapa",
        paymentStatus: "PENDING",
        paymentReference: tx_ref,
        status: "PENDING",
        couponCode: validCouponCode,
        couponDiscount: couponDiscountPercent,
        items: {
          create: validatedItems,
        },
      },
      include: { items: true },
    });

    // 6. Increment coupon usage if valid
    if (validCouponCode) {
      await prisma.coupon.updateMany({
        where: { code: validCouponCode },
        data: { usageCount: { increment: 1 } },
      });
    }

    // 7. Call Chapa Initialize API (Server-Side Secret Key)
    const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
    if (!chapaSecretKey) {
      console.error("[Chapa Configuration Error] CHAPA_SECRET_KEY is not configured in environment variables.");
      return NextResponse.json(
        { error: "Payment configuration error: CHAPA_SECRET_KEY is missing." },
        { status: 500 }
      );
    }
    
    // Get host for return & callback URLs
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`;

    const nameParts = finalCustomerName.trim().split(" ");
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "User";

    const chapaPayload: any = {
      amount: serverTotal.toString(),
      currency: "ETB",
      email: finalCustomerEmail,
      first_name: firstName,
      last_name: lastName,
      phone_number: customerPhone || "0900123456",
      tx_ref,
      return_url: `${baseUrl}/api/payments/chapa/verify?tx_ref=${tx_ref}`,
      customization: {
        title: "KicksLab",
        description: `Order ${orderNumber}`,
      },
    };

    if (!baseUrl.includes("localhost")) {
      chapaPayload.callback_url = `${baseUrl}/api/payments/chapa/verify?tx_ref=${tx_ref}`;
    }

    console.log(`[Chapa Init] Requesting payment initialization for tx_ref: ${tx_ref}, total: ETB ${serverTotal}`);

    const chapaRes = await fetch("https://api.chapa.co/v1/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chapaSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chapaPayload),
    });

    const chapaContentType = chapaRes.headers.get("content-type") || "";
    let chapaData: any = {};
    if (chapaContentType.includes("application/json")) {
      chapaData = await chapaRes.json();
    } else {
      const textResponse = await chapaRes.text();
      console.error("[Chapa Init Error] Chapa returned non-JSON response:", textResponse);
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "FAILED" },
      });
      return NextResponse.json(
        { error: "Chapa Payment Gateway returned an unparseable response." },
        { status: 502 }
      );
    }

    if (!chapaRes.ok || chapaData.status !== "success" || !chapaData.data?.checkout_url) {
      console.error("[Chapa Init Error]", chapaData);
      // Mark order as failed payment
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "FAILED" },
      });
      const errMsg = typeof chapaData.message === "string"
        ? chapaData.message
        : JSON.stringify(chapaData.message || chapaData || "Failed to initialize payment with Chapa.");

      return NextResponse.json(
        { error: errMsg },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: chapaData.data.checkout_url,
      orderId: order.id,
      orderNumber: order.orderNumber,
      tx_ref,
    });
  } catch (error: any) {
    console.error("[Chapa Initialization Route Error]", error);
    return NextResponse.json(
      { error: error.message || "Server error initializing Chapa payment." },
      { status: 500 }
    );
  }
}
