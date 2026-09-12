import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/session";
import { formatReviewerName } from "@/lib/reviews";

// GET /api/products/[id]/reviews
// Public endpoint - returns ONLY APPROVED reviews and aggregate rating data
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, rating: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort") || "recent";

    let orderBy: any = { createdAt: "desc" };
    if (sort === "highest") {
      orderBy = [{ rating: "desc" }, { createdAt: "desc" }];
    } else if (sort === "lowest") {
      orderBy = [{ rating: "asc" }, { createdAt: "desc" }];
    }

    // Fetch approved reviews
    const approvedReviews = await prisma.review.findMany({
      where: {
        productId: id,
        status: "APPROVED",
      },
      orderBy,
      select: {
        id: true,
        authorName: true,
        rating: true,
        title: true,
        comment: true,
        isVerifiedPurchase: true,
        createdAt: true,
      },
    });

    const totalReviews = approvedReviews.length;

    // Rating distribution
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    for (const r of approvedReviews) {
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating]++;
      }
      sum += r.rating;
    }

    const averageRating = totalReviews > 0 ? Number((sum / totalReviews).toFixed(1)) : 0;

    const distributionFormatted = [5, 4, 3, 2, 1].map((stars) => {
      const count = distribution[stars] || 0;
      const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
      return { stars, count, percentage };
    });

    // Check session customer eligibility if logged in
    let userEligibility = {
      isLoggedIn: false,
      hasPurchased: false,
      alreadyReviewed: false,
      existingReview: null as any,
    };

    const session = await getCustomerSession(req);
    if (session) {
      userEligibility.isLoggedIn = true;

      const [existingReview, deliveredOrder] = await Promise.all([
        prisma.review.findUnique({
          where: {
            productId_userId: {
              productId: id,
              userId: session.id,
            },
          },
          select: {
            id: true,
            status: true,
            rating: true,
            title: true,
            comment: true,
            createdAt: true,
          },
        }),
        prisma.order.findFirst({
          where: {
            userId: session.id,
            status: "DELIVERED",
            items: {
              some: { productId: id },
            },
          },
          select: { id: true },
        }),
      ]);

      userEligibility.hasPurchased = !!deliveredOrder;
      userEligibility.alreadyReviewed = !!existingReview;
      userEligibility.existingReview = existingReview;
    }

    // Public sanitized reviews
    const sanitizedReviews = approvedReviews.map((r) => ({
      id: r.id,
      authorName: formatReviewerName(r.authorName),
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      isVerifiedPurchase: r.isVerifiedPurchase,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({
      reviews: sanitizedReviews,
      totalReviews,
      averageRating,
      distribution: distributionFormatted,
      starCounts: distribution,
      userEligibility,
    });
  } catch (error) {
    console.error("GET /api/products/[id]/reviews error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews." }, { status: 500 });
  }
}

// POST /api/products/[id]/reviews
// Customer endpoint - submits a verified-purchase review in PENDING status
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCustomerSession(req);
  if (!session) {
    return NextResponse.json({ error: "Sign in to write a review." }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { rating, title, comment } = body;

    // Rating validation: integer 1..5
    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5 stars." },
        { status: 400 }
      );
    }

    // Comment validation: non-empty, max 2000 chars
    if (typeof comment !== "string" || !comment.trim()) {
      return NextResponse.json({ error: "Review comment is required." }, { status: 400 });
    }
    const trimmedComment = comment.trim();
    if (trimmedComment.length > 2000) {
      return NextResponse.json(
        { error: "Review comment must not exceed 2000 characters." },
        { status: 400 }
      );
    }

    // Optional title validation: max 100 chars
    let trimmedTitle: string | null = null;
    if (title !== undefined && title !== null) {
      if (typeof title !== "string") {
        return NextResponse.json({ error: "Title must be text." }, { status: 400 });
      }
      trimmedTitle = title.trim();
      if (trimmedTitle.length > 100) {
        return NextResponse.json(
          { error: "Review title must not exceed 100 characters." },
          { status: 400 }
        );
      }
      if (trimmedTitle.length === 0) {
        trimmedTitle = null;
      }
    }

    // Server-side verified purchase check: DELIVERED order with this product
    const deliveredOrder = await prisma.order.findFirst({
      where: {
        userId: session.id,
        status: "DELIVERED",
        items: {
          some: { productId: id },
        },
      },
      select: { id: true },
    });

    if (!deliveredOrder) {
      return NextResponse.json(
        { error: "Reviews are available to customers who have purchased and received this product." },
        { status: 403 }
      );
    }

    // Duplicate check
    const existingReview = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId: id,
          userId: session.id,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product." },
        { status: 409 }
      );
    }

    // Fetch freshest user name from DB
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { name: true, email: true },
    });

    const authorName = user?.name || session.name || "Verified Customer";
    const authorEmail = user?.email || session.email;

    // Create review with PENDING status
    const review = await prisma.review.create({
      data: {
        productId: id,
        userId: session.id,
        authorName,
        authorEmail,
        rating,
        title: trimmedTitle,
        comment: trimmedComment,
        isVerifiedPurchase: true,
        status: "PENDING",
      },
      select: {
        id: true,
        productId: true,
        rating: true,
        title: true,
        comment: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Thank you! Your review has been submitted and is pending moderation.",
        review,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/products/[id]/reviews error:", error);
    return NextResponse.json({ error: "Failed to submit review." }, { status: 500 });
  }
}
