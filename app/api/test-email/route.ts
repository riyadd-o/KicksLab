import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const recipient = searchParams.get("to");

    if (!recipient) {
      return NextResponse.json(
        {
          error: "Recipient email parameter 'to' is required. Example: /api/test-email?to=your-email@gmail.com",
        },
        { status: 400 }
      );
    }

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      const missing = [];
      if (!emailUser) missing.push("EMAIL_USER");
      if (!emailPass) missing.push("EMAIL_PASS");
      return NextResponse.json(
        {
          success: false,
          error: `Missing environment configuration: ${missing.join(" and ")} must be set in .env.`,
        },
        { status: 500 }
      );
    }

    console.log(`[Gmail Test Endpoint] Testing connection for sender: ${emailUser}`);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    // Verify SMTP Connection first
    await transporter.verify();
    console.log("[Gmail Test Endpoint] SMTP transporter connection verified successfully.");

    // Send Test Email
    const info = await transporter.sendMail({
      from: `KicksLab Test <${emailUser}>`,
      to: recipient,
      subject: "KicksLab Gmail SMTP Test 👟",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; background: #0D0D0D; color: #F5F0E8; border-radius: 8px;">
          <h1 style="color: #C9A96E;">KicksLab Gmail SMTP Test</h1>
          <p>If you are receiving this email, your Gmail SMTP integration with Nodemailer is working perfectly!</p>
          <hr style="border-color: #2A2420;" />
          <p style="font-size: 12px; color: #A89880;">Sent via process.env.EMAIL_USER (${emailUser})</p>
        </div>
      `,
    });

    console.log(`[Gmail Test Endpoint] Email delivered successfully to ${recipient}. Message ID: ${info.messageId}`);

    return NextResponse.json({
      success: true,
      message: `Test email successfully sent to ${recipient} via Gmail SMTP!`,
      messageId: info.messageId,
      sender: emailUser,
    });
  } catch (err: any) {
    let category = "SMTP Error";
    if (err.code === "EAUTH" || err.responseCode === 535) {
      category = "Authentication Failed: Check EMAIL_USER and EMAIL_PASS (App Password required)";
    } else if (err.code === "ESOCKET" || err.code === "ETIMEDOUT") {
      category = "Connection Failed: Cannot reach smtp.gmail.com:465";
    }

    console.error(`[Gmail Test Endpoint Error] [${category}]:`, err.message || err);

    return NextResponse.json(
      {
        success: false,
        category,
        error: err.message || String(err),
      },
      { status: 500 }
    );
  }
}
