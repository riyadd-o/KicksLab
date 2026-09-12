import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken, setAdminCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
    }

    if (user.role !== "ADMIN" && user.role !== "STAFF") {
      return NextResponse.json({ error: "Access denied. Not an admin or staff account." }, { status: 403 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = await signToken(payload);
    const res = NextResponse.json({ success: true, user: payload });
    setAdminCookie(res, token);
    return res;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
