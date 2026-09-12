import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken, setCustomerCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (user.role !== "USER") {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: "USER",
    };

    const token = await signToken(payload);
    const res = NextResponse.json({ success: true, user: payload });
    setCustomerCookie(res, token);
    return res;
  } catch (error) {
    console.error("Customer login error:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
