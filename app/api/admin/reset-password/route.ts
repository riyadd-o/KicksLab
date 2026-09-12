import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || typeof token !== "string" || !newPassword || typeof newPassword !== "string") {
      return NextResponse.json({ error: "Token and new password are required." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    // Compute SHA-256 hash of token provided by client
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Look up token in DB
    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetTokenRecord) {
      return NextResponse.json({ error: "Invalid or expired password reset token." }, { status: 400 });
    }

    // Ensure token is unused, not expired, and user has ADMIN role
    if (resetTokenRecord.usedAt) {
      return NextResponse.json({ error: "This password reset token has already been used." }, { status: 400 });
    }

    if (new Date() > resetTokenRecord.expiresAt) {
      return NextResponse.json({ error: "This password reset token has expired." }, { status: 400 });
    }

    if (resetTokenRecord.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized user role." }, { status: 403 });
    }

    // Hash new password using bcrypt (12 rounds)
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update Admin password & invalidate token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetTokenRecord.userId },
        data: {
          password: hashedPassword,
          plainPassword: null, // Ensure plain text is cleared/not stored
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetTokenRecord.id },
        data: {
          usedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Admin password successfully updated. You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("[Admin Reset Password Error]:", error);
    return NextResponse.json(
      { error: "An error occurred while resetting the password." },
      { status: 500 }
    );
  }
}
