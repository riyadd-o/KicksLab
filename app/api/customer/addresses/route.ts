import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const VALID_LABELS = ["Home", "Office", "Family", "Other"];

// GET /api/customer/addresses - Fetch all saved addresses for the authenticated customer
export async function GET(req: NextRequest) {
  try {
    const session = await getCustomerSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await prisma.savedAddress.findMany({
      where: { userId: session.id },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Fetch saved addresses error:", error);
    return NextResponse.json({ error: "Failed to fetch saved addresses." }, { status: 500 });
  }
}

// POST /api/customer/addresses - Create a new saved delivery address
export async function POST(req: NextRequest) {
  try {
    const session = await getCustomerSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { label, fullName, phone, city, streetAddress, postalCode, isDefault } = body;

    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json({ error: "Recipient full name is required." }, { status: 400 });
    }
    if (!phone || typeof phone !== "string" || !phone.trim()) {
      return NextResponse.json({ error: "Delivery phone number is required." }, { status: 400 });
    }
    if (!city || typeof city !== "string" || !city.trim()) {
      return NextResponse.json({ error: "City is required." }, { status: 400 });
    }
    if (!streetAddress || typeof streetAddress !== "string" || !streetAddress.trim()) {
      return NextResponse.json({ error: "Street address is required." }, { status: 400 });
    }

    const normalizedLabel = VALID_LABELS.includes(label) ? label : "Home";

    // Check existing address count for this user
    const existingCount = await prisma.savedAddress.count({
      where: { userId: session.id },
    });

    // If this is the first address, or if explicitly requested as default
    const makeDefault = existingCount === 0 || Boolean(isDefault);

    if (makeDefault && existingCount > 0) {
      // Demote existing default addresses
      await prisma.savedAddress.updateMany({
        where: { userId: session.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.savedAddress.create({
      data: {
        userId: session.id,
        label: normalizedLabel,
        fullName: fullName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        streetAddress: streetAddress.trim(),
        postalCode: postalCode ? String(postalCode).trim() : null,
        isDefault: makeDefault,
      },
    });

    return NextResponse.json({ success: true, address: newAddress }, { status: 201 });
  } catch (error) {
    console.error("Create saved address error:", error);
    return NextResponse.json({ error: "Failed to create saved address." }, { status: 500 });
  }
}
