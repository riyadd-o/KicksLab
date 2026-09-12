import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { getDropStatus } from "@/lib/promotions";

export const dynamic = "force-dynamic";

// GET /api/admin/limited-drops/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await getAdminSession(req);
    if (!adminSession || (adminSession.role !== "ADMIN" && adminSession.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const { id } = await params;
    const drop = await prisma.limitedDrop.findUnique({
      where: { id },
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
    });

    if (!drop) {
      return NextResponse.json({ error: "Limited Drop not found." }, { status: 404 });
    }

    const status = getDropStatus(drop.startDate, drop.endDate, drop.isActive);

    return NextResponse.json({
      drop: {
        ...drop,
        status,
        productIds: drop.products.map((p) => p.productId),
      },
    });
  } catch (error) {
    console.error("Fetch drop error:", error);
    return NextResponse.json({ error: "Failed to fetch drop details." }, { status: 500 });
  }
}

// PUT /api/admin/limited-drops/[id] — Update existing Limited Drop
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await getAdminSession(req);
    if (!adminSession || adminSession.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.limitedDrop.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Limited Drop not found." }, { status: 404 });
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

    const dataToUpdate: any = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return NextResponse.json({ error: "Title cannot be empty." }, { status: 400 });
      }
      dataToUpdate.title = title.trim();
    }

    if (description !== undefined) {
      dataToUpdate.description = description ? description.trim() : null;
    }

    if (discountType !== undefined) {
      dataToUpdate.discountType = discountType === "fixed" ? "fixed" : "percentage";
    }

    if (discountValue !== undefined) {
      const numVal = Number(discountValue);
      if (isNaN(numVal) || numVal <= 0) {
        return NextResponse.json({ error: "Valid positive discount value required." }, { status: 400 });
      }
      dataToUpdate.discountValue = numVal;
    }

    let start = existing.startDate;
    let end = existing.endDate;

    if (startDate !== undefined) {
      start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return NextResponse.json({ error: "Invalid start date format." }, { status: 400 });
      }
      dataToUpdate.startDate = start;
    }

    if (endDate !== undefined) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return NextResponse.json({ error: "Invalid end date format." }, { status: 400 });
      }
      dataToUpdate.endDate = end;
    }

    if (end <= start) {
      return NextResponse.json({ error: "End date must be after start date." }, { status: 400 });
    }

    if (isActive !== undefined) {
      dataToUpdate.isActive = Boolean(isActive);
    }

    if (bannerImage !== undefined) {
      dataToUpdate.bannerImage = bannerImage ? String(bannerImage).trim() : null;
    }

    // Update drop and product associations in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update drop fields
      const drop = await tx.limitedDrop.update({
        where: { id },
        data: dataToUpdate,
      });

      // 2. If productIds were provided, replace associations
      if (Array.isArray(productIds)) {
        await tx.limitedDropProduct.deleteMany({
          where: { limitedDropId: id },
        });

        if (productIds.length > 0) {
          await tx.limitedDropProduct.createMany({
            data: productIds.map((pId: string) => ({
              limitedDropId: id,
              productId: pId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return drop;
    });

    const formattedDrop = {
      ...updated,
      status: getDropStatus(updated.startDate, updated.endDate, updated.isActive),
    };

    return NextResponse.json({ success: true, drop: formattedDrop });
  } catch (error: any) {
    console.error("Update limited drop error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update limited drop." }, { status: 500 });
  }
}

// DELETE /api/admin/limited-drops/[id] — Delete a Limited Drop
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await getAdminSession(req);
    if (!adminSession || adminSession.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.limitedDrop.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Limited Drop not found." }, { status: 404 });
    }

    // Cascade deletes LimitedDropProduct links; historical orders remain untouched
    await prisma.limitedDrop.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete limited drop error:", error);
    return NextResponse.json({ error: "Failed to delete limited drop." }, { status: 500 });
  }
}
