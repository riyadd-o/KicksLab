import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/session";

// GET /api/customer/reviews
// Returns:
// A. Products from DELIVERED orders waiting for review
// B. Customer's submitted reviews
export async function GET(req: NextRequest) {
  const session = await getCustomerSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    // 1. Fetch all customer's reviews
    const myReviewsRaw = await prisma.review.findMany({
      where: { userId: session.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
            price: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const reviewedProductIds = new Set(myReviewsRaw.map((r) => r.productId));

    // Map status label for UI
    const myReviews = myReviewsRaw.map((r) => {
      let displayStatus = "Pending Review";
      if (r.status === "APPROVED") displayStatus = "Published";
      if (r.status === "HIDDEN") displayStatus = "Hidden";

      return {
        id: r.id,
        productId: r.productId,
        product: r.product,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        status: r.status,
        displayStatus,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        isVerifiedPurchase: r.isVerifiedPurchase,
      };
    });

    // 2. Fetch DELIVERED orders belonging to this user
    const deliveredOrders = await prisma.order.findMany({
      where: {
        userId: session.id,
        status: "DELIVERED",
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Extract items waiting for review (each product only once)
    const seenWaitingProductIds = new Set<string>();
    const waitingReviews: Array<{
      productId: string;
      productName: string;
      productSlug: string;
      productImage: string;
      purchasedSize: string;
      orderNumber: string;
      orderDate: Date;
    }> = [];

    for (const order of deliveredOrders) {
      for (const item of order.items) {
        if (!item.productId) continue;
        if (!reviewedProductIds.has(item.productId) && !seenWaitingProductIds.has(item.productId)) {
          seenWaitingProductIds.add(item.productId);
          waitingReviews.push({
            productId: item.productId,
            productName: item.name || item.product?.name || "KicksLab Sneaker",
            productSlug: item.product?.slug || item.productId,
            productImage: item.image || item.product?.images?.[0] || "/images/placeholder.jpg",
            purchasedSize: item.size,
            orderNumber: order.orderNumber,
            orderDate: order.createdAt,
          });
        }
      }
    }

    return NextResponse.json({
      waitingReviews,
      myReviews,
    });
  } catch (error) {
    console.error("GET /api/customer/reviews error:", error);
    return NextResponse.json({ error: "Failed to fetch customer reviews." }, { status: 500 });
  }
}
