import { prisma } from "@/lib/prisma";

/**
 * Recalculates and updates the cached Product.rating field based STRICTLY on APPROVED reviews.
 * If there are no approved reviews, rating is set to 0.
 */
export async function recalculateProductRating(productId: string): Promise<{ average: number; count: number }> {
  try {
    const aggregate = await prisma.review.aggregate({
      where: {
        productId,
        status: "APPROVED",
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    const count = aggregate._count.id;
    const rawAvg = aggregate._avg.rating;
    const average = count > 0 && rawAvg ? Number(rawAvg.toFixed(1)) : 0;

    await prisma.product.update({
      where: { id: productId },
      data: { rating: average },
    });

    return { average, count };
  } catch (error) {
    console.error(`Error recalculating rating for product ${productId}:`, error);
    throw error;
  }
}

/**
 * Formats a reviewer's full name to a privacy-safe public display name (e.g., "John Doe" -> "John D.").
 * Never reveals customer email or internal account identifiers.
 */
export function formatReviewerName(fullName?: string | null): string {
  if (!fullName || typeof fullName !== "string") {
    return "Verified Customer";
  }

  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "Verified Customer";
  }

  if (parts.length === 1) {
    return parts[0];
  }

  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}.`;
}
