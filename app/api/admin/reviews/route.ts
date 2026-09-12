import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

// GET /api/admin/reviews
// Admin-only listing of all reviews with status/rating filters and search
export async function GET(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "ALL";
    const ratingFilter = searchParams.get("rating") || "ALL";
    const searchQuery = (searchParams.get("search") || "").trim();

    // Build where filter
    const where: any = {};

    if (statusFilter !== "ALL" && ["PENDING", "APPROVED", "HIDDEN"].includes(statusFilter)) {
      where.status = statusFilter;
    }

    if (ratingFilter !== "ALL") {
      const parsedRating = parseInt(ratingFilter, 10);
      if (!isNaN(parsedRating) && parsedRating >= 1 && parsedRating <= 5) {
        where.rating = parsedRating;
      }
    }

    if (searchQuery) {
      where.OR = [
        { authorName: { contains: searchQuery, mode: "insensitive" } },
        { authorEmail: { contains: searchQuery, mode: "insensitive" } },
        { title: { contains: searchQuery, mode: "insensitive" } },
        { comment: { contains: searchQuery, mode: "insensitive" } },
        { product: { name: { contains: searchQuery, mode: "insensitive" } } },
      ];
    }

    // Execute query and count metrics in parallel
    const [reviews, totalCount, pendingCount, approvedCount, hiddenCount] = await Promise.all([
      prisma.review.findMany({
        where,
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
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.count(),
      prisma.review.count({ where: { status: "PENDING" } }),
      prisma.review.count({ where: { status: "APPROVED" } }),
      prisma.review.count({ where: { status: "HIDDEN" } }),
    ]);

    return NextResponse.json({
      reviews,
      stats: {
        total: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        hidden: hiddenCount,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/reviews error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews." }, { status: 500 });
  }
}
