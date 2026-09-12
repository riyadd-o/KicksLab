import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getCustomerSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      memberId: true,
      name: true,
      email: true,
      phone: true,
      gender: true,
      country: true,
      address: true,
      streetAddress: true,
      city: true,
      postalCode: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user || user.role !== "USER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ user });
}

export async function PUT(req: NextRequest) {
  const session = await getCustomerSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, email, phone, gender, country, city, streetAddress, address, postalCode } = await req.json();

    let emailToUpdate: string | undefined;
    if (email && typeof email === "string" && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (existing && existing.id !== session.id) {
        return NextResponse.json({ error: "This email is already in use by another account." }, { status: 400 });
      }
      emailToUpdate = normalizedEmail;
    }

    const targetStreet = streetAddress !== undefined ? streetAddress : address;

    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(emailToUpdate ? { email: emailToUpdate } : {}),
        ...(phone !== undefined ? { phone: phone ? phone.trim() : null } : {}),
        ...(gender !== undefined ? { gender: gender ? gender.trim() : null } : {}),
        ...(country !== undefined ? { country: country ? country.trim() : "Ethiopia" } : {}),
        ...(city !== undefined ? { city: city ? city.trim() : null } : {}),
        ...(targetStreet !== undefined ? {
          streetAddress: targetStreet ? targetStreet.trim() : null,
          address: targetStreet ? targetStreet.trim() : null
        } : {}),
        ...(postalCode !== undefined ? { postalCode: postalCode ? postalCode.trim() : null } : {}),
      },
      select: {
        id: true,
        memberId: true,
        name: true,
        email: true,
        phone: true,
        gender: true,
        country: true,
        address: true,
        streetAddress: true,
        city: true,
        postalCode: true,
        role: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Customer profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
