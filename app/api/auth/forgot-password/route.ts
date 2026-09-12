import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendCustomerPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || user.role !== "USER") {
      return NextResponse.json(
        { error: "No customer account found with this email address." },
        { status: 400 }
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    sendCustomerPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    }).catch((err) => {
      console.error("Customer password reset email delivery failed:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Password reset instructions have been sent to your email address.",
    });
  } catch (error) {
    console.error("Customer forgot password error:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
