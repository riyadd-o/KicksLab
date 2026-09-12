import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyGuestReviewToken } from "@/lib/review-token";

export const dynamic = "force-dynamic";

// GET /api/reviews/guest?token=...
// Verifies guest review token and returns order and item details for the review form
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Review token is required." },
        { status: 400 }
      );
    }

    const payload = await verifyGuestReviewToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "This review link is invalid or has expired (valid for 30 days)." },
        { status: 401 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: payload.orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order could not be found." },
        { status: 404 }
      );
    }

    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Reviews can only be submitted after your order has been successfully delivered." },
        { status: 403 }
      );
    }

    if (order.customerEmail.toLowerCase().trim() !== payload.email.toLowerCase().trim()) {
      return NextResponse.json(
        { error: "Email verification mismatch for this order." },
        { status: 403 }
      );
    }

    // Check which items in this order have already been reviewed
    const existingReviews = await prisma.review.findMany({
      where: {
        orderId: order.id,
      },
      select: {
        productId: true,
        status: true,
        rating: true,
      },
    });

    const reviewedProductIds = new Set(existingReviews.map((r) => r.productId));

    const eligibleItems = order.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      size: item.size,
      price: item.price,
      image: item.product?.images?.[0] || item.image || "/placeholder-shoe.png",
      alreadyReviewed: item.productId ? reviewedProductIds.has(item.productId) : false,
    }));

    return NextResponse.json({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      items: eligibleItems,
      preferredProductId: payload.productId || (eligibleItems[0]?.productId ?? null),
    });
  } catch (error: any) {
    console.error("Guest review verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify review permission." },
      { status: 500 }
    );
  }
}

// POST /api/reviews/guest
// Submits a verified guest review
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, productId, rating, title, comment } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Review token is required." },
        { status: 400 }
      );
    }

    const payload = await verifyGuestReviewToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "This review authorization is invalid or has expired." },
        { status: 401 }
      );
    }

    if (!productId || typeof productId !== "string") {
      return NextResponse.json(
        { error: "A valid product selection is required." },
        { status: 400 }
      );
    }

    // Rating validation: integer 1..5
    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5 stars." },
        { status: 400 }
      );
    }

    // Comment validation
    if (typeof comment !== "string" || !comment.trim()) {
      return NextResponse.json(
        { error: "Review comment is required." },
        { status: 400 }
      );
    }
    const trimmedComment = comment.trim();
    if (trimmedComment.length < 5) {
      return NextResponse.json(
        { error: "Please write at least 5 characters in your review." },
        { status: 400 }
      );
    }
    if (trimmedComment.length > 2000) {
      return NextResponse.json(
        { error: "Review comment must not exceed 2000 characters." },
        { status: 400 }
      );
    }

    // Title validation
    let trimmedTitle: string | null = null;
    if (title && typeof title === "string") {
      trimmedTitle = title.trim().slice(0, 100);
      if (trimmedTitle.length === 0) trimmedTitle = null;
    }

    // Verify order and product eligibility
    const order = await prisma.order.findUnique({
      where: { id: payload.orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Reviews are only available for delivered orders." },
        { status: 403 }
      );
    }

    if (order.customerEmail.toLowerCase().trim() !== payload.email.toLowerCase().trim()) {
      return NextResponse.json(
        { error: "Email verification failed for this order." },
        { status: 403 }
      );
    }

    // Verify the product was actually part of this delivered order
    const hasProductInOrder = order.items.some((i) => i.productId === productId);
    if (!hasProductInOrder) {
      return NextResponse.json(
        { error: "This product was not part of your delivered order." },
        { status: 403 }
      );
    }

    // Replay protection: check if a review for this order and product already exists
    const existingReview = await prisma.review.findFirst({
      where: {
        orderId: order.id,
        productId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already submitted a review for this product from this order." },
        { status: 409 }
      );
    }

    // Create the verified purchase review in PENDING status for moderation
    const newReview = await prisma.review.create({
      data: {
        productId,
        orderId: order.id,
        userId: null,
        authorName: order.customerName || "Verified Guest",
        authorEmail: order.customerEmail,
        rating,
        title: trimmedTitle,
        comment: trimmedComment,
        isVerifiedPurchase: true,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Thank you! Your verified review has been submitted for moderation and will appear on the product page once approved.",
      reviewId: newReview.id,
    });
  } catch (error: any) {
    console.error("Guest review submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit review. Please try again." },
      { status: 500 }
    );
  }
}
