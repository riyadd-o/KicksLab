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

    // Invalidate/delete any previous reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

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

    // Determine base URL dynamically (with support for production Vercel deployment)
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const origin = host ? `${proto}://${host}` : "";
    const baseUrl = process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost")
      ? process.env.NEXTAUTH_URL
      : origin || process.env.NEXTAUTH_URL || "http://localhost:3000";

    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    const emailResult = await sendCustomerPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });

    if (!emailResult.success) {
      console.error("[Customer Forgot Password] Failed to deliver email:", emailResult.error);
      return NextResponse.json(
        { error: `Failed to deliver reset email: ${emailResult.error || "Please check email configuration in environment settings."}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password reset instructions have been sent to your email address.",
    });
  } catch (error: any) {
    console.error("Customer forgot password error:", error);
    return NextResponse.json({ error: error?.message || "An unexpected error occurred." }, { status: 500 });
  }
}
