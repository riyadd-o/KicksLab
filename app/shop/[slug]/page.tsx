import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { applyEffectivePriceToProduct, applyEffectivePrices } from '@/lib/promotions';
import ProductDetailClient from '@/components/product/ProductDetailClient';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
    },
  });

  if (!product) {
    return {
      title: 'Product Not Found | KicksLab Luxury Footwear',
    };
  }

  return {
    title: `${product.name} | KicksLab Boutique`,
    description: product.description || `Discover ${product.name} at KicksLab Luxury Footwear.`,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Direct, instantaneous database lookup by slug OR id
  const rawProduct = await prisma.product.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
    },
    include: {
      _count: {
        select: {
          reviews: {
            where: { status: "APPROVED" },
          },
        },
      },
    },
  });

  if (!rawProduct) {
    notFound();
  }

  const formattedRawProduct = {
    ...rawProduct,
    reviewsCount: rawProduct._count?.reviews ?? 0,
  };

  // Calculate promotional effective pricing and query related products in parallel
  const [product, rawRelated] = await Promise.all([
    applyEffectivePriceToProduct(formattedRawProduct),
    prisma.product.findMany({
      where: {
        id: { not: rawProduct.id },
        category: { equals: rawProduct.category, mode: 'insensitive' },
      },
      include: {
        _count: {
          select: {
            reviews: {
              where: { status: "APPROVED" },
            },
          },
        },
      },
      take: 6,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!product) {
    notFound();
  }

  const formattedRelated = rawRelated.map((p) => ({
    ...p,
    reviewsCount: p._count?.reviews ?? 0,
  }));

  let relatedProducts = await applyEffectivePrices(formattedRelated);

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts}
    />
  );
}
