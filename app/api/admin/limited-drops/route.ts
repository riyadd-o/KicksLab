import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { getDropStatus } from "@/lib/promotions";

export const dynamic = "force-dynamic";

// GET /api/admin/limited-drops — List all drops for Admin
export async function GET(req: NextRequest) {
  try {
    const adminSession = await getAdminSession(req);
    if (!adminSession || (adminSession.role !== "ADMIN" && adminSession.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const drops = await prisma.limitedDrop.findMany({
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                images: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedDrops = drops.map((drop) => {
      const status = getDropStatus(drop.startDate, drop.endDate, drop.isActive);
      return {
        ...drop,
        status,
        productCount: drop.products.length,
      };
    });

    return NextResponse.json({ drops: formattedDrops });
  } catch (error) {
    console.error("Admin fetch limited drops error:", error);
    return NextResponse.json({ error: "Failed to fetch limited drops" }, { status: 500 });
  }
}

// POST /api/admin/limited-drops — Create a new Limited Drop
export async function POST(req: NextRequest) {
  try {
    const adminSession = await getAdminSession(req);
    if (!adminSession || adminSession.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      isActive,
      bannerImage,
      productIds,
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Campaign title is required." }, { status: 400 });
    }

    const numDiscount = Number(discountValue);
    if (isNaN(numDiscount) || numDiscount <= 0) {
      return NextResponse.json({ error: "A valid positive discount value is required." }, { status: 400 });
    }

    if (discountType === "percentage" && numDiscount > 100) {
      return NextResponse.json({ error: "Percentage discount cannot exceed 100%." }, { status: 400 });
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start and end dates are required." }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid date format provided." }, { status: 400 });
    }

    if (end <= start) {
      return NextResponse.json({ error: "End date must be after start date." }, { status: 400 });
    }

    const selectedProductIds: string[] = Array.isArray(productIds) ? productIds : [];

    const newDrop = await prisma.limitedDrop.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        discountType: discountType === "fixed" ? "fixed" : "percentage",
        discountValue: numDiscount,
        startDate: start,
        endDate: end,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        bannerImage: bannerImage ? String(bannerImage).trim() : null,
        products: {
          create: selectedProductIds.map((pId) => ({
            productId: pId,
          })),
        },
      },
      include: {
        products: {
          include: {
            product: {
              select: { id: true, name: true, price: true },
            },
          },
        },
      },
    });

    const formattedDrop = {
      ...newDrop,
      status: getDropStatus(newDrop.startDate, newDrop.endDate, newDrop.isActive),
      productCount: newDrop.products.length,
    };

    return NextResponse.json({ success: true, drop: formattedDrop }, { status: 201 });
  } catch (error: any) {
    console.error("Admin create limited drop error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create limited drop." }, { status: 500 });
  }
}
