import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Reset token is required." }, { status: 400 });
    }

    if (!newPassword) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetTokenRecord) {
      return NextResponse.json({ error: "Invalid or expired password reset link." }, { status: 400 });
    }

    if (resetTokenRecord.usedAt) {
      return NextResponse.json({ error: "This password reset link has already been used." }, { status: 400 });
    }

    if (new Date() > resetTokenRecord.expiresAt) {
      return NextResponse.json({ error: "This password reset link has expired." }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password & mark token used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetTokenRecord.userId },
        data: { password: hashedPassword, plainPassword: null },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetTokenRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully reset. You can now sign in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
