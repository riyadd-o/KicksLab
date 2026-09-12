import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const VALID_LABELS = ["Home", "Office", "Family", "Other"];

// GET /api/customer/addresses/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCustomerSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const address = await prisma.savedAddress.findFirst({
      where: {
        id,
        userId: session.id,
      },
    });

    if (!address) {
      return NextResponse.json({ error: "Address not found." }, { status: 404 });
    }

    return NextResponse.json({ address });
  } catch (error) {
    console.error("Fetch address error:", error);
    return NextResponse.json({ error: "Failed to fetch address." }, { status: 500 });
  }
}

// PUT /api/customer/addresses/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCustomerSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.savedAddress.findFirst({
      where: {
        id,
        userId: session.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Address not found." }, { status: 404 });
    }

    const body = await req.json();
    const { label, fullName, phone, city, streetAddress, postalCode, isDefault } = body;

    const dataToUpdate: any = {};

    if (fullName !== undefined) {
      if (typeof fullName !== "string" || !fullName.trim()) {
        return NextResponse.json({ error: "Recipient full name is required." }, { status: 400 });
      }
      dataToUpdate.fullName = fullName.trim();
    }

    if (phone !== undefined) {
      if (typeof phone !== "string" || !phone.trim()) {
        return NextResponse.json({ error: "Delivery phone number is required." }, { status: 400 });
      }
      dataToUpdate.phone = phone.trim();
    }

    if (city !== undefined) {
      if (typeof city !== "string" || !city.trim()) {
        return NextResponse.json({ error: "City is required." }, { status: 400 });
      }
      dataToUpdate.city = city.trim();
    }

    if (streetAddress !== undefined) {
      if (typeof streetAddress !== "string" || !streetAddress.trim()) {
        return NextResponse.json({ error: "Street address is required." }, { status: 400 });
      }
      dataToUpdate.streetAddress = streetAddress.trim();
    }

    if (postalCode !== undefined) {
      dataToUpdate.postalCode = postalCode ? String(postalCode).trim() : null;
    }

    if (label !== undefined) {
      dataToUpdate.label = VALID_LABELS.includes(label) ? label : existing.label;
    }

    // Handle isDefault logic
    if (isDefault === true && !existing.isDefault) {
      // Demote all other addresses for this user
      await prisma.savedAddress.updateMany({
        where: { userId: session.id, isDefault: true },
        data: { isDefault: false },
      });
      dataToUpdate.isDefault = true;
    }

    const updated = await prisma.savedAddress.update({
      where: { id: existing.id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, address: updated });
  } catch (error) {
    console.error("Update address error:", error);
    return NextResponse.json({ error: "Failed to update address." }, { status: 500 });
  }
}

// DELETE /api/customer/addresses/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCustomerSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.savedAddress.findFirst({
      where: {
        id,
        userId: session.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Address not found." }, { status: 404 });
    }

    await prisma.savedAddress.delete({
      where: { id: existing.id },
    });

    // If the deleted address was the default, promote the newest remaining address
    if (existing.isDefault) {
      const remainingAddress = await prisma.savedAddress.findFirst({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
      });

      if (remainingAddress) {
        await prisma.savedAddress.update({
          where: { id: remainingAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete address error:", error);
    return NextResponse.json({ error: "Failed to delete address." }, { status: 500 });
  }
}
