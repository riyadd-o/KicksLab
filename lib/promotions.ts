import { prisma } from "@/lib/prisma";

export type DropStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'INACTIVE';

/**
 * Determines the server-side status of a Limited Drop based on current time
 */
export function getDropStatus(
  startDate: Date | string,
  endDate: Date | string,
  isActive: boolean,
  now: Date = new Date()
): DropStatus {
  if (!isActive) return 'INACTIVE';
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) return 'SCHEDULED';
  if (now >= start && now < end) return 'LIVE';
  return 'ENDED';
}

/**
 * Calculates the promotional drop price from base price and discount configuration
 */
export function calculateDropPrice(
  basePrice: number,
  discountType: string,
  discountValue: number
): number {
  if (discountType === 'fixed') {
    return Math.max(0, Math.round(basePrice - discountValue));
  }
  // Default to percentage
  const percentage = Math.min(100, Math.max(0, discountValue));
  return Math.max(0, Math.round(basePrice * (1 - percentage / 100)));
}

/**
 * Queries the database for the currently LIVE Limited Drop (if any) affecting a specific product
 */
export async function getActiveDropForProduct(productId: string) {
  const now = new Date();

  const activeDrop = await prisma.limitedDrop.findFirst({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gt: now },
      products: {
        some: {
          OR: [
            { productId },
            { product: { slug: productId } },
          ],
        },
      },
    },
    include: {
      products: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return activeDrop;
}

/**
 * Queries the single currently LIVE Limited Drop for public display on the homepage
 */
export async function getLiveLimitedDrop() {
  const now = new Date();

  const liveDrop = await prisma.limitedDrop.findFirst({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gt: now },
    },
    include: {
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              originalPrice: true,
              images: true,
              stock: true,
              inStock: true,
              category: true,
              rating: true,
              featured: true,
              topSelling: true,
              onSale: true,
              isNew: true,
              _count: {
                select: {
                  reviews: {
                    where: { status: 'APPROVED' },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!liveDrop) return null;

  // Format products with calculated promotional drop prices and actual stock
  const formattedProducts = liveDrop.products.map((item) => {
    const p = item.product;
    const dropPrice = calculateDropPrice(p.price, liveDrop.discountType, liveDrop.discountValue);
    const discountBadge =
      liveDrop.discountType === 'fixed'
        ? `ETB ${liveDrop.discountValue.toLocaleString()} OFF`
        : `${liveDrop.discountValue}% OFF`;

    return {
      ...p,
      reviewsCount: p._count?.reviews ?? 0,
      originalPrice: p.price, // previous price crossed out
      price: dropPrice,       // active drop promotional price
      dropPrice,
      dropDiscountBadge: discountBadge,
      isDropItem: true,
      isLimitedDrop: true,
      onSale: true,
    };
  });

  return {
    id: liveDrop.id,
    title: liveDrop.title,
    description: liveDrop.description,
    discountType: liveDrop.discountType,
    discountValue: liveDrop.discountValue,
    startDate: liveDrop.startDate.toISOString(),
    endDate: liveDrop.endDate.toISOString(),
    bannerImage: liveDrop.bannerImage,
    products: formattedProducts,
  };
}

/**
 * Applies the effective selling price to an array of products based on currently LIVE Limited Drops.
 * Preserves base price in originalPrice if a promotional discount applies.
 */
export async function applyEffectivePrices<T extends { id: string; price: number; originalPrice?: number | null; slug?: string; name?: string }>(
  items: T[]
): Promise<T[]> {
  if (!items || items.length === 0) return items;

  const now = new Date();
  const activeDrops = await prisma.limitedDrop.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gt: now },
    },
    include: {
      products: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (activeDrops.length === 0) {
    return items;
  }

  return items.map((product) => {
    // Check if this product is part of any active drop
    const dropForProduct = activeDrops.find((drop) =>
      drop.products.some((dp) => dp.productId === product.id)
    );

    if (dropForProduct) {
      const dropPrice = calculateDropPrice(
        product.price,
        dropForProduct.discountType,
        dropForProduct.discountValue
      );

      const discountBadge =
        dropForProduct.discountType === 'fixed'
          ? `ETB ${dropForProduct.discountValue.toLocaleString()} OFF`
          : `${dropForProduct.discountValue}% OFF`;

      return {
        ...product,
        basePrice: product.price,
        originalPrice: product.originalPrice ?? product.price,
        price: dropPrice,
        dropPrice,
        dropDiscountBadge: discountBadge,
        isDropItem: true,
        isDropDiscounted: true,
        isLimitedDrop: true,
        onSale: true,
      };
    }

    return product;
  });
}

/**
 * Applies the effective selling price to a single product if currently in a LIVE Limited Drop.
 */
export async function applyEffectivePriceToProduct<T extends { id: string; price: number; originalPrice?: number | null; slug?: string; name?: string }>(
  product: T | null
): Promise<T | null> {
  if (!product) return null;
  const [res] = await applyEffectivePrices([product]);
  return res;
}
