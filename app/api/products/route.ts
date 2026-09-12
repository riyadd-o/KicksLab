import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { applyEffectivePrices, applyEffectivePriceToProduct } from "@/lib/promotions";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category   = searchParams.get("category");
    const gender     = searchParams.get("gender");
    const search     = searchParams.get("search");
    const featured   = searchParams.get("featured");
    const onSale     = searchParams.get("onSale");
    const isNew      = searchParams.get("isNew");
    const topSelling = searchParams.get("topSelling");
    const minPrice   = searchParams.get("minPrice");
    const maxPrice   = searchParams.get("maxPrice");
    const slug       = searchParams.get("slug");
    const limit      = searchParams.get("limit");
    const isRaw      = searchParams.get("raw") === "true" || searchParams.get("admin") === "true";

    const where: any = {};

    // Single product by slug or id
    if (slug) {
      const product = await prisma.product.findFirst({
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
      if (!product) {
        return NextResponse.json(null);
      }
      const formatted = {
        ...product,
        reviewsCount: product._count?.reviews ?? 0,
      };
      const finalProduct = isRaw ? formatted : await applyEffectivePriceToProduct(formatted);
      return NextResponse.json(finalProduct);
    }

    if (category) where.category = { equals: category, mode: "insensitive" };

    if (gender && gender !== "All") {
      const gLower = gender.toLowerCase();
      if (gLower === "male" || gLower === "men") {
        where.gender = { in: ["Men", "Male", "Unisex"], mode: "insensitive" };
      } else if (gLower === "female" || gLower === "women") {
        where.gender = { in: ["Women", "Female", "Unisex"], mode: "insensitive" };
      } else {
        where.gender = { equals: gender, mode: "insensitive" };
      }
    }

    if (featured)   where.featured   = true;
    if (onSale)     where.onSale     = true;
    if (isNew)      where.isNew      = true;
    if (topSelling) where.topSelling = true;

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (search && search.trim()) {
      const terms = search.trim().split(/\s+/).filter(Boolean);
      if (terms.length > 1) {
        where.AND = terms.map((term) => ({
          OR: [
            { name:        { contains: term, mode: "insensitive" } },
            { description: { contains: term, mode: "insensitive" } },
            { category:    { contains: term, mode: "insensitive" } },
            { slug:        { contains: term, mode: "insensitive" } },
          ],
        }));
      } else {
        const term = terms[0];
        where.OR = [
          { name:        { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
          { category:    { contains: term, mode: "insensitive" } },
          { slug:        { contains: term, mode: "insensitive" } },
        ];
      }
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...(limit ? { take: parseInt(limit, 10) } : {}),
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

    const formattedProducts = products.map((p) => ({
      ...p,
      reviewsCount: p._count?.reviews ?? 0,
    }));

    const finalProducts = isRaw ? formattedProducts : await applyEffectivePrices(formattedProducts);
    return NextResponse.json(finalProducts);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name, slug, description, price, originalPrice,
      category, gender, sizes, images,
      featured, topSelling, onSale, isNew, stock,
    } = body;

    if (!name || !slug || !description || !price || !category) {
      return NextResponse.json(
        { error: "Name, slug, description, price, and category are required." },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A product with this slug already exists." },
        { status: 409 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price:         parseFloat(price),
        originalPrice: (onSale && originalPrice) ? parseFloat(originalPrice) : null,
        category,
        gender:        gender    || "Unisex",
        sizes:         sizes     || [],
        images:        images    || [],
        rating:        0,
        featured:      featured  ?? false,
        topSelling:    topSelling ?? false,
        onSale:        onSale    ?? false,
        isNew:         isNew     ?? false,
        stock:         stock     ?? 10,
      },
    });

    console.log("Created product:", product.name, product.id);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to create product." },
      { status: 500 }
    );
  }
}
