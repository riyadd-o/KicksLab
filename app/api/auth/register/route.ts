import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken, setCustomerCookie } from "@/lib/session";
import { sendWelcomeEmail } from "@/lib/email";
import { generateMemberId } from "@/lib/memberId";

export async function POST(req: NextRequest) {
  try {
    const {
      name,
      email,
      phone,
      gender,
      country,
      city,
      streetAddress,
      postalCode,
      password,
      confirmPassword,
    } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }

    if (!email || !email.trim() || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Please enter your phone number." }, { status: 400 });
    }

    const validGenders = ["Male", "Female"];
    if (!gender || !validGenders.includes(gender.trim())) {
      return NextResponse.json({ error: "Please select a valid gender (Male or Female)." }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: "Please enter a password." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check duplicate with case-insensitive match
    const existing = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in or reset your password." },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate unique Member ID
    let memberId = generateMemberId();
    let existingMember = await prisma.user.findUnique({ where: { memberId } });
    while (existingMember) {
      memberId = generateMemberId();
      existingMember = await prisma.user.findUnique({ where: { memberId } });
    }

    // Create user as USER role
    const newUser = await prisma.user.create({
      data: {
        memberId,
        name: name.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        gender: gender.trim(),
        country: country?.trim() || "Ethiopia",
        city: city?.trim() || null,
        streetAddress: streetAddress?.trim() || null,
        address: streetAddress?.trim() || null,
        postalCode: postalCode?.trim() || null,
        password: hashedPassword,
        role: "USER",
      },
    });

    const payload = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      memberId: newUser.memberId,
      role: "USER",
    };

    const token = await signToken(payload);
    const res = NextResponse.json({ success: true, user: payload });

    setCustomerCookie(res, token);

    // Send Welcome Email with Member ID
    try {
      await sendWelcomeEmail({ to: newUser.email, name: newUser.name, memberId: newUser.memberId || undefined });
    } catch (err) {
      console.error("Welcome email delivery failed:", err);
    }

    return res;
  } catch (error: unknown) {
    console.error("Customer registration error:", error);
    const err = error as { code?: string; message?: string };
    if (
      err?.code === "P2002" ||
      err?.message?.includes("User_email_key") ||
      err?.message?.includes("User_lower_email_idx")
    ) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in or reset your password." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
