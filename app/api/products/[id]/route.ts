import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { applyEffectivePriceToProduct } from "@/lib/promotions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const isRaw = req.nextUrl.searchParams.get("raw") === "true" || req.nextUrl.searchParams.get("admin") === "true";
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
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
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const formatted = {
      ...product,
      reviewsCount: product._count?.reviews ?? 0,
    };
    const finalProduct = isRaw ? formatted : await applyEffectivePriceToProduct(formatted);
    return NextResponse.json(finalProduct);
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

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
    const body = await req.json();
    const updateData: any = {};

    if (body.name          !== undefined) updateData.name          = body.name;
    if (body.slug          !== undefined) updateData.slug          = body.slug;
    if (body.description   !== undefined) updateData.description   = body.description;
    if (body.price         !== undefined) updateData.price         = parseFloat(body.price);
    if (body.originalPrice !== undefined) updateData.originalPrice = body.originalPrice ? parseFloat(body.originalPrice) : null;
    if (body.category      !== undefined) updateData.category      = body.category;
    if (body.gender        !== undefined) updateData.gender        = body.gender;
    if (body.sizes         !== undefined) updateData.sizes         = body.sizes;
    if (body.images        !== undefined) updateData.images        = body.images;
    if (body.featured      !== undefined) updateData.featured      = body.featured;
    if (body.topSelling    !== undefined) updateData.topSelling    = body.topSelling;
    if (body.onSale        !== undefined) {
      updateData.onSale = body.onSale;
      if (!body.onSale) {
        updateData.originalPrice = null;
      }
    }
    if (body.isNew         !== undefined) updateData.isNew         = body.isNew;
    if (body.stock         !== undefined) updateData.stock         = parseInt(body.stock);

    const product = await prisma.product.update({
      where: { id },
      data:  updateData,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("PUT /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update product." },
      { status: 500 }
    );
  }
}

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

    // 1. Remove from any active or past limited drops
    await prisma.limitedDropProduct.deleteMany({
      where: { productId: id },
    });

    // 2. Remove product reviews
    await prisma.review.deleteMany({
      where: { productId: id },
    });

    // 3. Nullify productId on OrderItems to preserve order history snapshots
    await prisma.$executeRaw`UPDATE "OrderItem" SET "productId" = NULL WHERE "productId" = ${id};`;

    // 4. Delete the product
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete product." },
      { status: 500 }
    );
  }
}
