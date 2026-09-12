import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatReviewerName } from "@/lib/reviews";

export const dynamic = "force-dynamic";

// GET /api/reviews/featured
// Public endpoint for Homepage Boutique Reviews section.
// Returns ONLY APPROVED + FEATURED reviews with safe privacy fields.
export async function GET(req: NextRequest) {
  try {
    const featuredReviews = await prisma.review.findMany({
      where: {
        status: "APPROVED",
        isFeatured: true,
      },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            name: true,
            slug: true,
            images: true,
            category: true,
          },
        },
        user: {
          select: {
            savedAddresses: {
              where: { isDefault: true },
              select: { city: true },
              take: 1,
            },
          },
        },
      },
    });

    const safeReviews = featuredReviews.map((r) => {
      // Safe non-sensitive customer display name
      const safeName = formatReviewerName(r.authorName) || "Verified Buyer";

      // Non-sensitive city/location if available
      const safeCity = r.user?.savedAddresses?.[0]?.city || null;

      return {
        id: r.id,
        name: safeName,
        rating: r.rating,
        title: r.title,
        quote: r.comment,
        location: safeCity,
        productName: r.product?.name || null,
        productSlug: r.product?.slug || null,
        createdAt: r.createdAt,
      };
    });

    return NextResponse.json({
      reviews: safeReviews,
    });
  } catch (error) {
    console.error("GET /api/reviews/featured error:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured reviews." },
      { status: 500 }
    );
  }
}
