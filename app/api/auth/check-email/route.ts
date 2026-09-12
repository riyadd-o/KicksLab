import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body || {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ exists: false });
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
      },
    });

    // Strictly returns existence boolean only to protect privacy and prevent data exposure
    return NextResponse.json({ exists: !!user });
  } catch (error) {
    console.error("Check email error:", error);
    return NextResponse.json({ exists: false });
  }
}
