import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAdminPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Valid email address is required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Look up Admin account strictly by role === ADMIN and matching email
    const adminUser = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
        role: "ADMIN",
      },
    });

    const successResponse = NextResponse.json({
      success: true,
      message: "If an account with that email exists, you will receive a password reset link.",
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: "No admin account found with this email address." },
        { status: 404 }
      );
    }

    // Invalidate/delete any existing password reset tokens for this admin
    await prisma.passwordResetToken.deleteMany({
      where: { userId: adminUser.id },
    });

    // Generate cryptographically secure random token
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Store SHA-256 hash of token in database
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    await prisma.passwordResetToken.create({
      data: {
        userId: adminUser.id,
        tokenHash,
        expiresAt,
      },
    });

    // Build reset link with dynamic baseUrl
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const origin = host ? `${proto}://${host}` : "";
    const baseUrl = process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost")
      ? process.env.NEXTAUTH_URL
      : origin || process.env.NEXTAUTH_URL || "http://localhost:3000";

    const resetUrl = `${baseUrl}/admin/reset-password?token=${rawToken}`;

    // Dispatch reset email
    const emailResult = await sendAdminPasswordResetEmail({
      to: adminUser.email,
      resetUrl,
    });

    if (!emailResult.success) {
      console.error("[Admin Forgot Password] Failed to deliver email:", emailResult.error);
      return NextResponse.json(
        { error: `Failed to send reset email: ${emailResult.error || "Please check email configuration."}` },
        { status: 500 }
      );
    }

    return successResponse;
  } catch (error: any) {
    console.error("[Admin Forgot Password Error]:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
