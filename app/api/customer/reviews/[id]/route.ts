import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/session";
import { recalculateProductRating } from "@/lib/reviews";

// PUT /api/customer/reviews/[id]
// Allows customer to edit their own review
// Important: resets status back to PENDING and recalculates rating
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCustomerSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;

    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    // Strict ownership verification
    if (existingReview.userId !== session.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to edit this review." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { rating, title, comment } = body;

    // Rating validation
    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5 stars." },
        { status: 400 }
      );
    }

    // Comment validation
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

    // Optional title validation
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

    const wasApproved = existingReview.status === "APPROVED";

    // Update review: Reset status to PENDING
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        rating,
        title: trimmedTitle,
        comment: trimmedComment,
        status: "PENDING",
      },
    });

    // If the review was previously approved, recalculate product rating
    if (wasApproved) {
      await recalculateProductRating(existingReview.productId);
    }

    return NextResponse.json({
      message: "Review updated successfully and resubmitted for admin moderation.",
      review: updatedReview,
    });
  } catch (error) {
    console.error("PUT /api/customer/reviews/[id] error:", error);
    return NextResponse.json({ error: "Failed to update review." }, { status: 500 });
  }
}
