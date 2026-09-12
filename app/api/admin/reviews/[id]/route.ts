import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { recalculateProductRating } from "@/lib/reviews";

// PUT /api/admin/reviews/[id]
// Admin updates review status (PENDING, APPROVED, HIDDEN)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { status, isFeatured } = body;

    const existing = await prisma.review.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    const updateData: any = {};

    if (status !== undefined) {
      if (!["PENDING", "APPROVED", "HIDDEN"].includes(status)) {
        return NextResponse.json(
          { error: "Invalid review status. Must be PENDING, APPROVED, or HIDDEN." },
          { status: 400 }
        );
      }
      updateData.status = status;
      // If unapproved, automatically remove featured status
      if (status !== "APPROVED") {
        updateData.isFeatured = false;
      }
    }

    if (isFeatured !== undefined) {
      const targetStatus = status || existing.status;
      if (isFeatured && targetStatus !== "APPROVED") {
        return NextResponse.json(
          { error: "Only APPROVED reviews can be marked as Featured on the homepage." },
          { status: 400 }
        );
      }
      updateData.isFeatured = Boolean(isFeatured);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No update parameters provided (status or isFeatured)." },
        { status: 400 }
      );
    }

    const updated = await prisma.review.update({
      where: { id },
      data: updateData,
    });

    // Recalculate product rating to reflect approval/hidden/pending state
    if (status !== undefined && status !== existing.status) {
      await recalculateProductRating(existing.productId);
    }

    return NextResponse.json({
      message: "Review updated successfully.",
      review: updated,
    });
  } catch (error) {
    console.error("PUT /api/admin/reviews/[id] error:", error);
    return NextResponse.json({ error: "Failed to update review status." }, { status: 500 });
  }
}

// DELETE /api/admin/reviews/[id]
// Admin deletes review permanently
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const { id } = await params;

    const existing = await prisma.review.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    const productId = existing.productId;

    await prisma.review.delete({
      where: { id },
    });

    // Recalculate product rating
    await recalculateProductRating(productId);

    return NextResponse.json({
      message: "Review successfully deleted.",
    });
  } catch (error) {
    console.error("DELETE /api/admin/reviews/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete review." }, { status: 500 });
  }
}
