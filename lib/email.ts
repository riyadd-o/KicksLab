import nodemailer from "nodemailer";

function createTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    const missing: string[] = [];
    if (!user) missing.push("EMAIL_USER");
    if (!pass) missing.push("EMAIL_PASS");
    const errMsg = `EMAIL_USER and EMAIL_PASS must be configured. Missing: ${missing.join(", ")}`;
    console.error(`[Email Service Error] ${errMsg}`);
    throw new Error(errMsg);
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user,
      pass,
    },
  });
}

function getSenderAddress(): string {
  const user = process.env.EMAIL_USER;
  if (!user) {
    throw new Error("EMAIL_USER is not configured in environment variables.");
  }
  return `KicksLab <${user}>`;
}

interface WelcomeEmailProps {
  to: string;
  name: string;
  memberId?: string;
}

export async function sendWelcomeEmail({ to, name, memberId }: WelcomeEmailProps): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const sender = getSenderAddress();
    const transporter = createTransporter();
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    console.log(`[Email Service] Sending welcome email via Gmail SMTP to ${to}`);

    const info = await transporter.sendMail({
      from: sender,
      to,
      subject: "Welcome to KicksLab 👟",
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; background: #0D0D0D; color: #F5F0E8; padding: 32px; border-radius: 12px; border: 1px solid #2A2420;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #C9A96E; font-size: 28px; font-weight: 800; tracking: 2px; margin: 0;">KICKSLAB</h1>
            <p style="color: #A89880; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Premium Footwear Boutique</p>
          </div>
          <h2 style="color: #F5F0E8; font-size: 20px; margin-top: 0;">Hi ${name},</h2>
          <p style="color: #D4CEB8; font-size: 15px; line-height: 1.6;">Welcome to KicksLab!</p>
          <p style="color: #D4CEB8; font-size: 15px; line-height: 1.6;">Your account has been successfully created. You can now browse our exclusive footwear collection, place orders, and track your purchases seamlessly.</p>
          ${memberId ? `
          <div style="background: #141414; padding: 16px; border-radius: 8px; border: 1px solid #2A2420; text-align: center; margin: 20px 0;">
            <p style="color: #A89880; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Your KicksLab Member ID</p>
            <p style="color: #C9A96E; font-size: 18px; font-weight: 800; tracking: 1px; margin: 0;">${memberId}</p>
          </div>
          ` : ''}
          <div style="text-align: center; margin: 32px 0;">
            <a href="${baseUrl}/shop" style="background: #C9A96E; color: #0D0D0D; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Start Shopping →</a>
          </div>

          <hr style="border: 0; border-top: 1px solid #2A2420; margin: 32px 0 20px 0;" />
          <p style="color: #A89880; font-size: 12px; text-align: center; margin: 0;">
            KicksLab · Dire Dawa & Addis Ababa, Ethiopia · info@kickslab.com
          </p>
        </div>
      `,
    });

    if (info.messageId) {
      console.log(`[Email Service] Delivered welcome email to ${to}. Message ID: ${info.messageId}`);
      return { success: true, id: info.messageId };
    }

    return { success: false, error: "No message ID returned by Gmail SMTP" };
  } catch (err: any) {
    console.error(`[Email Service Error] Failed to send welcome email to ${to}:`, err.message || err);
    return { success: false, error: err.message || String(err) };
  }
}

interface OrderConfirmationProps {
  to: string;
  name: string;
  orderNumber: string;
  orderDate?: Date | string;
  shippingAddress?: string;
  items: any[];
  subtotal?: number;
  couponDiscount?: number | null;
  shippingCost?: number;
  total: number;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentReference?: string | null;
  orderStatus?: string;
  baseUrl?: string;
}

export async function sendOrderConfirmationEmail({
  to,
  name,
  orderNumber,
  orderDate = new Date(),
  shippingAddress,
  items,
  subtotal,
  couponDiscount,
  shippingCost = 0,
  total,
  paymentMethod = "Chapa",
  paymentStatus = "PAID",
  paymentReference,
  orderStatus = "PROCESSING",
  baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000",
}: OrderConfirmationProps): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const sender = getSenderAddress();
    const transporter = createTransporter();

    console.log(`[Email Service] Sending order confirmation for order ${orderNumber} to ${to}`);

    const calcSubtotal = subtotal || items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    const discountAmount = couponDiscount ? Math.round(calcSubtotal * (couponDiscount / 100)) : 0;
    const formattedDate = typeof orderDate === "string" ? orderDate : new Date(orderDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const itemsHtml = items
      .map(
        (i) => `
        <tr style="border-bottom: 1px solid #2A2420;">
          <td style="padding: 12px 0; color: #F5F0E8;">${i.name || i.product?.name || "Sneaker"} ${i.size ? `(Size ${i.size})` : ""}</td>
          <td style="padding: 12px 0; color: #A89880; text-align: center;">x${i.quantity}</td>
          <td style="padding: 12px 0; color: #F5F0E8; text-align: right; font-weight: bold;">ETB ${((i.price || 0) * (i.quantity || 1)).toLocaleString()}</td>
        </tr>
      `
      )
      .join("");

    const isCOD = paymentMethod === "CASH_ON_DELIVERY" || paymentMethod === "COD";
    const displayPaymentMethod = isCOD ? "Cash on Delivery" : (paymentMethod || "Chapa");
    const displayPaymentStatus = isCOD && paymentStatus !== "PAID" ? "Payment pending" : (paymentStatus || "PAID");

    const greetingText = isCOD
      ? `Thank you for your order! Your order has been placed successfully. Please pay the delivery person in cash when your order arrives.`
      : `Thank you for your order! Your payment has been successfully processed via Chapa and your order status is <strong>${orderStatus}</strong>.`;

    const info = await transporter.sendMail({
      from: sender,
      to,
      subject: `Your KicksLab Order Has Been Confirmed #${orderNumber}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; background: #0D0D0D; color: #F5F0E8; padding: 32px; border-radius: 12px; border: 1px solid #2A2420;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #C9A96E; font-size: 28px; font-weight: 800; margin: 0;">KICKSLAB</h1>
            <p style="color: #4ADE80; font-size: 14px; font-weight: bold; margin-top: 6px;">✓ Order Confirmed</p>
          </div>

          <p style="color: #D4CEB8; font-size: 15px;">Hi <strong>${name}</strong>,</p>
          <p style="color: #D4CEB8; font-size: 15px; margin-bottom: 24px;">${greetingText}</p>

          ${
            isCOD
              ? `
          <div style="background: #1C1917; border: 1px solid #78350F; border-radius: 8px; padding: 14px; margin-bottom: 24px; text-align: center;">
            <p style="color: #FCD34D; font-size: 13px; font-weight: bold; margin: 0 0 4px 0;">💵 Cash on Delivery Payment</p>
            <p style="color: #D4CEB8; font-size: 13px; margin: 0;">Please pay <strong>ETB ${total.toLocaleString()}</strong> in cash when your order arrives.</p>
          </div>
          `
              : ""
          }

          <div style="background: #141414; padding: 20px; border-radius: 8px; border: 1px solid #2A2420; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #D4CEB8;">
              <tr>
                <td style="padding: 4px 0;"><strong>Order Number:</strong></td>
                <td style="text-align: right; color: #F5F0E8; font-weight: bold;">#${orderNumber}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Order Date:</strong></td>
                <td style="text-align: right; color: #F5F0E8;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Payment Method:</strong></td>
                <td style="text-align: right; color: #F5F0E8;">${displayPaymentMethod}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Payment Status:</strong></td>
                <td style="text-align: right; color: ${isCOD && paymentStatus !== 'PAID' ? '#FBBF24' : '#4ADE80'}; font-weight: bold;">${displayPaymentStatus}</td>
              </tr>
              ${
                paymentReference
                  ? `<tr>
                <td style="padding: 4px 0;"><strong>Chapa Ref ID:</strong></td>
                <td style="text-align: right; color: #C9A96E; font-family: monospace;">${paymentReference}</td>
              </tr>`
                  : ""
              }
              <tr>
                <td style="padding: 4px 0;"><strong>Order Status:</strong></td>
                <td style="text-align: right; color: #60A5FA; font-weight: bold;">${orderStatus}</td>
              </tr>
              ${
                shippingAddress
                  ? `<tr>
                <td style="padding: 4px 0;"><strong>Shipping Address:</strong></td>
                <td style="text-align: right; color: #F5F0E8;">${shippingAddress}</td>
              </tr>`
                  : ""
              }
            </table>
          </div>

          <h3 style="color: #F5F0E8; font-size: 16px; border-bottom: 1px solid #2A2420; padding-bottom: 8px; margin-bottom: 12px;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #D4CEB8; margin-bottom: 28px;">
            <tr>
              <td style="padding: 6px 0;">Subtotal:</td>
              <td style="text-align: right; color: #F5F0E8;">ETB ${calcSubtotal.toLocaleString()}</td>
            </tr>
            ${
              discountAmount > 0
                ? `<tr>
              <td style="padding: 6px 0; color: #C9A96E;">Discount:</td>
              <td style="text-align: right; color: #C9A96E;">-ETB ${discountAmount.toLocaleString()}</td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding: 6px 0;">Shipping Fee:</td>
              <td style="text-align: right; color: #F5F0E8;">${shippingCost === 0 ? '<span style="color:#4ADE80;">FREE</span>' : `ETB ${shippingCost.toLocaleString()}`}</td>
            </tr>
            <tr style="border-top: 1px solid #2A2420; font-weight: bold; font-size: 16px;">
              <td style="padding: 12px 0; color: #F5F0E8;">Final Total:</td>
              <td style="text-align: right; color: #C9A96E;">ETB ${total.toLocaleString()}</td>
            </tr>
          </table>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${baseUrl}/track-order" style="background: #C9A96E; color: #0D0D0D; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Track My Order →</a>
          </div>

          <hr style="border: 0; border-top: 1px solid #2A2420; margin: 32px 0 20px 0;" />
          <p style="color: #A89880; font-size: 12px; text-align: center; margin: 0;">
            KicksLab · Premium Footwear Boutique · info@kickslab.com
          </p>
        </div>
      `,
    });

    if (info.messageId) {
      console.log(`[Email Service] Delivered order confirmation for ${orderNumber}. Message ID: ${info.messageId}`);
      return { success: true, id: info.messageId };
    }

    return { success: false, error: "No message ID returned by Gmail SMTP" };
  } catch (err: any) {
    console.error(`[Email Service Error] Failed to send order confirmation email for ${orderNumber} to ${to}:`, err.message || err);
    return { success: false, error: err.message || String(err) };
  }
}

interface AdminPasswordResetProps {
  to: string;
  resetUrl: string;
}

export async function sendAdminPasswordResetEmail({ to, resetUrl }: AdminPasswordResetProps): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const sender = getSenderAddress();
    const transporter = createTransporter();

    console.log(`[Email Service] Sending Admin Password Reset email to ${to}`);

    const info = await transporter.sendMail({
      from: sender,
      to,
      subject: "KicksLab Admin — Password Reset Request",
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; background: #0D0D0D; color: #F5F0E8; padding: 32px; border-radius: 12px; border: 1px solid #2A2420;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #C9A96E; font-size: 28px; font-weight: 800; tracking: 2px; margin: 0;">KICKSLAB</h1>
            <p style="color: #A89880; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Admin Portal Access</p>
          </div>
          <h2 style="color: #F5F0E8; font-size: 20px; margin-top: 0;">Password Reset Requested</h2>
          <p style="color: #D4CEB8; font-size: 15px; line-height: 1.6;">A password reset request was issued for your KicksLab Administrator account.</p>
          <p style="color: #D4CEB8; font-size: 15px; line-height: 1.6;">Click the button below to set a new password. This link is valid for 60 minutes and can only be used once.</p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: #C9A96E; color: #0D0D0D; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Reset Admin Password →</a>
          </div>

          <p style="color: #A89880; font-size: 13px; line-height: 1.5;">If you did not request a password reset, please ignore this message.</p>

          <hr style="border: 0; border-top: 1px solid #2A2420; margin: 32px 0 20px 0;" />
          <p style="color: #A89880; font-size: 12px; text-align: center; margin: 0;">
            KicksLab Security System
          </p>
        </div>
      `,
    });

    return { success: true, id: info.messageId };
  } catch (err: any) {
    console.error(`[Email Service Error] Failed to send admin password reset email to ${to}:`, err.message || err);
    return { success: false, error: err.message || String(err) };
  }
}

interface CustomerPasswordResetProps {
  to: string;
  name?: string;
  resetUrl: string;
}

export async function sendCustomerPasswordResetEmail({ to, name, resetUrl }: CustomerPasswordResetProps): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const sender = getSenderAddress();
    const transporter = createTransporter();

    console.log(`[Email Service] Sending Customer Password Reset email to ${to}`);
    const customerName = name || "Valued Customer";

    const info = await transporter.sendMail({
      from: sender,
      to,
      subject: "KicksLab — Password Reset Request",
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; background: #0D0D0D; color: #F5F0E8; padding: 32px; border-radius: 12px; border: 1px solid #2A2420;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #C9A96E; font-size: 28px; font-weight: 800; letter-spacing: 2px; margin: 0;">KICKSLAB</h1>
            <p style="color: #A89880; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Luxury Footwear Boutique</p>
          </div>
          <h2 style="color: #F5F0E8; font-size: 20px; margin-top: 0;">Reset Your Password</h2>
          <p style="color: #D4CEB8; font-size: 15px; line-height: 1.6;">Hello ${customerName},</p>
          <p style="color: #D4CEB8; font-size: 15px; line-height: 1.6;">We received a request to reset the password for your KicksLab account.</p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: #C9A96E; color: #0D0D0D; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Reset Password →</a>
          </div>

          <hr style="border: 0; border-top: 1px solid #2A2420; margin: 32px 0 20px 0;" />
          <p style="color: #A89880; font-size: 12px; text-align: center; margin: 0;">
            © KicksLab Premium Footwear
          </p>
        </div>
      `,
    });

    return { success: true, id: info.messageId };
  } catch (err: any) {
    console.error(`[Email Service Error] Failed to send customer password reset email to ${to}:`, err.message || err);
    return { success: false, error: err.message || String(err) };
  }
}

// ─── REFUND NOTIFICATION EMAILS ──────────────────────────
export function formatRefundMethodLabel(refundMethod?: string | null, originalPaymentMethod?: string | null): string {
  if (refundMethod) {
    const norm = refundMethod.trim().toUpperCase();
    if (norm === "TELEBIRR") return "Telebirr";
    if (norm === "CBE") return "CBE";
    if (norm === "EBIRR") return "eBirr";
    if (norm === "AWASH_BIRR") return "Awash Birr";
    return refundMethod;
  }
  
  if (originalPaymentMethod) {
    const normPm = originalPaymentMethod.trim().toUpperCase();
    if (normPm === "CHAPA") return "Chapa";
    if (normPm === "CASH_ON_DELIVERY" || normPm === "COD" || normPm.includes("CASH")) {
      return "your selected refund method";
    }
    return originalPaymentMethod;
  }

  return "your selected refund method";
}

interface RefundApprovedEmailProps {
  to: string;
  customerName: string;
  refundNumber: string;
  orderNumber?: string;
  amount: number;
  paymentMethod: string;
  refundMethod?: string | null;
  refundAccountName?: string | null;
  refundAccountNumber?: string | null;
  refundPhoneNumber?: string | null;
  staffNote?: string;
}

export async function sendRefundApprovedEmail({
  to,
  customerName,
  refundNumber,
  orderNumber,
  amount,
  paymentMethod,
  refundMethod,
  refundAccountName,
  refundAccountNumber,
  refundPhoneNumber,
  staffNote,
}: RefundApprovedEmailProps): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const sender = getSenderAddress();
    const transporter = createTransporter();

    const normPm = (paymentMethod || "").trim().toUpperCase();
    const isCod = normPm === "CASH_ON_DELIVERY" || normPm === "COD" || normPm.includes("CASH");
    const destinationLabel = formatRefundMethodLabel(refundMethod, paymentMethod);

    console.log(`[Refund Email] Sending refund approval email to ${to} for refund ${refundNumber} (Destination: ${destinationLabel})`);

    const info = await transporter.sendMail({
      from: sender,
      to,
      subject: `Your KicksLab Refund Request Has Been Approved — ${refundNumber}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; background: #0D0D0D; color: #F5F0E8; padding: 32px; border-radius: 12px; border: 1px solid #2A2420;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #C9A96E; font-size: 28px; font-weight: 800; letter-spacing: 2px; margin: 0;">KICKSLAB</h1>
            <p style="color: #A89880; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Refund Department</p>
          </div>

          <h2 style="color: #4ADE80; font-size: 20px; margin-top: 0;">Refund Request Approved</h2>
          <p style="color: #D4CEB8; font-size: 15px;">Dear <strong>${customerName}</strong>,</p>
          <p style="color: #D4CEB8; font-size: 15px; margin-bottom: 20px;">
            ${
              isCod
                ? `Your refund request <strong>${refundNumber}</strong> ${orderNumber ? `for order <strong>#${orderNumber}</strong>` : ''} has been approved by our team and is being processed for payout via <strong>${destinationLabel}</strong>.`
                : `Your refund request <strong>${refundNumber}</strong> ${orderNumber ? `for order <strong>#${orderNumber}</strong>` : ''} has been approved by our team and submitted to ${destinationLabel} for processing.`
            }
          </p>

          <div style="background: #141414; padding: 16px; border-radius: 8px; border: 1px solid #2A2420; margin-bottom: 20px; font-size: 13px;">
            <p style="margin: 4px 0; color: #D4CEB8;"><strong>Refund Reference:</strong> <span style="color: #C9A96E; font-weight: bold;">${refundNumber}</span></p>
            ${orderNumber ? `<p style="margin: 4px 0; color: #D4CEB8;"><strong>Order Number:</strong> #${orderNumber}</p>` : ''}
            <p style="margin: 4px 0; color: #D4CEB8;"><strong>Refund Amount:</strong> <span style="color: #4ADE80; font-weight: bold;">ETB ${amount.toLocaleString()}</span></p>
            <p style="margin: 4px 0; color: #D4CEB8;"><strong>Payout Destination:</strong> <span style="color: #F5F0E8; font-weight: bold;">${destinationLabel}</span></p>
            ${
              refundAccountName
                ? `<p style="margin: 4px 0; color: #D4CEB8;"><strong>Account Name:</strong> ${refundAccountName}</p>`
                : ""
            }
            ${
              refundAccountNumber
                ? `<p style="margin: 4px 0; color: #D4CEB8;"><strong>Account Number:</strong> <span style="color: #C9A96E; font-family: monospace;">${refundAccountNumber}</span></p>`
                : ""
            }
            ${
              refundPhoneNumber
                ? `<p style="margin: 4px 0; color: #D4CEB8;"><strong>Phone Number:</strong> <span style="color: #C9A96E; font-family: monospace;">${refundPhoneNumber}</span></p>`
                : ""
            }
          </div>

          ${staffNote ? `
          <div style="background: #0A0A0A; padding: 16px; border-radius: 8px; border: 1px solid #2A2420; margin-bottom: 24px;">
            <p style="color: #A89880; font-size: 11px; text-transform: uppercase; font-weight: bold; margin: 0 0 6px 0;">Note from KicksLab:</p>
            <p style="color: #D4CEB8; font-size: 13px; line-height: 1.5; margin: 0;">${staffNote}</p>
          </div>
          ` : ''}

          <p style="color: #D4CEB8; font-size: 14px; margin-bottom: 24px;">
            You will receive another email once your refund has been successfully sent through ${destinationLabel}.
          </p>

          <hr style="border: 0; border-top: 1px solid #2A2420; margin: 32px 0 20px 0;" />
          <p style="color: #A89880; font-size: 12px; text-align: center; margin: 0;">
            KicksLab E-Commerce Store · Dire Dawa & Addis Ababa, Ethiopia
          </p>
        </div>
      `,
    });

    return { success: true, id: info.messageId };
  } catch (err: any) {
    console.error(`[Email Error] Failed to send refund approval email to ${to}:`, err.message || err);
    return { success: false, error: err.message || String(err) };
  }
}

interface RefundSuccessEmailProps {
  to: string;
  customerName: string;
  refundNumber: string;
  orderNumber: string;
  amount: number;
  paymentMethod: string;
  refundMethod?: string | null;
  refundAccountName?: string | null;
  refundAccountNumber?: string | null;
  refundPhoneNumber?: string | null;
  chapaRefundRef?: string | null;
}

export async function sendRefundSuccessEmail({
  to,
  customerName,
  refundNumber,
  orderNumber,
  amount,
  paymentMethod,
  refundMethod,
  refundAccountName,
  refundAccountNumber,
  refundPhoneNumber,
  chapaRefundRef,
}: RefundSuccessEmailProps): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const sender = getSenderAddress();
    const transporter = createTransporter();

    const normPm = (paymentMethod || "").trim().toUpperCase();
    const isCod = normPm === "CASH_ON_DELIVERY" || normPm === "COD" || normPm.includes("CASH");
    const destinationLabel = formatRefundMethodLabel(refundMethod, paymentMethod);

    console.log(`[Refund Email] Sending refund success/completed email to ${to} for refund ${refundNumber} (Destination: ${destinationLabel})`);

    const info = await transporter.sendMail({
      from: sender,
      to,
      subject: `Your KicksLab Refund Has Been Completed — ${refundNumber}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; background: #0D0D0D; color: #F5F0E8; padding: 32px; border-radius: 12px; border: 1px solid #2A2420;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #C9A96E; font-size: 28px; font-weight: 800; letter-spacing: 2px; margin: 0;">KICKSLAB</h1>
            <p style="color: #4ADE80; font-size: 13px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; margin-top: 4px;">✓ Refund Completed</p>
          </div>

          <h2 style="color: #F5F0E8; font-size: 20px; margin-top: 0;">Hello ${customerName},</h2>
          <p style="color: #D4CEB8; font-size: 15px; margin-bottom: 20px;">
            ${
              isCod
                ? `Your Cash on Delivery order refund of <strong style="color: #4ADE80;">ETB ${amount.toLocaleString()}</strong> has been successfully sent through <strong>${destinationLabel}</strong>.`
                : `Your refund of <strong style="color: #4ADE80;">ETB ${amount.toLocaleString()}</strong> for order <strong>#${orderNumber}</strong> has been successfully completed.`
            }
          </p>

          <div style="background: #141414; padding: 20px; border-radius: 8px; border: 1px solid #2A2420; margin-bottom: 24px; font-size: 13px;">
            <p style="margin: 6px 0; color: #D4CEB8;"><strong>Refund Request:</strong> <span style="color: #C9A96E; font-weight: bold;">${refundNumber}</span></p>
            <p style="margin: 6px 0; color: #D4CEB8;"><strong>Order Number:</strong> #${orderNumber}</p>
            <p style="margin: 6px 0; color: #D4CEB8;"><strong>Refund Amount:</strong> <span style="color: #4ADE80; font-weight: bold; font-size: 15px;">ETB ${amount.toLocaleString()}</span></p>
            <p style="margin: 6px 0; color: #D4CEB8;"><strong>Original Payment:</strong> ${isCod ? "Cash on Delivery" : paymentMethod}</p>
            <p style="margin: 6px 0; color: #D4CEB8;"><strong>Refund Destination:</strong> <span style="color: #F5F0E8; font-weight: bold;">${destinationLabel}</span></p>
            ${
              refundAccountName
                ? `<p style="margin: 6px 0; color: #D4CEB8;"><strong>Account Name:</strong> ${refundAccountName}</p>`
                : ""
            }
            ${
              refundAccountNumber
                ? `<p style="margin: 6px 0; color: #D4CEB8;"><strong>Account Number:</strong> <span style="color: #C9A96E; font-family: monospace;">${refundAccountNumber}</span></p>`
                : ""
            }
            ${
              refundPhoneNumber
                ? `<p style="margin: 6px 0; color: #D4CEB8;"><strong>Phone Number:</strong> <span style="color: #C9A96E; font-family: monospace;">${refundPhoneNumber}</span></p>`
                : ""
            }
            ${
              chapaRefundRef
                ? `<p style="margin: 6px 0; color: #D4CEB8;"><strong>${destinationLabel} Refund Reference:</strong> <span style="color: #C9A96E; font-family: monospace;">${chapaRefundRef}</span></p>`
                : ""
            }
          </div>

          <p style="color: #D4CEB8; font-size: 14px; margin-bottom: 24px; line-height: 1.6;">
            The refund has been successfully processed through ${destinationLabel}.
            <br />
            Thank you for shopping with KicksLab.
          </p>

          <hr style="border: 0; border-top: 1px solid #2A2420; margin: 32px 0 20px 0;" />
          <p style="color: #A89880; font-size: 12px; text-align: center; margin: 0;">
            KicksLab · Dire Dawa & Addis Ababa, Ethiopia · info@kickslab.com
          </p>
        </div>
      `,
    });

    return { success: true, id: info.messageId };
  } catch (err: any) {
    console.error(`[Email Error] Failed to send refund success email to ${to}:`, err.message || err);
    return { success: false, error: err.message || String(err) };
  }
}

interface RefundFailedEmailProps {
  to: string;
  customerName: string;
  refundNumber: string;
  orderNumber?: string;
}

export async function sendRefundFailedEmail({
  to,
  customerName,
  refundNumber,
  orderNumber,
}: RefundFailedEmailProps): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const sender = getSenderAddress();
    const transporter = createTransporter();

    console.log(`[Refund Email] Sending refund update/failed email to ${to} for refund ${refundNumber}`);

    const info = await transporter.sendMail({
      from: sender,
      to,
      subject: `Update Regarding Your KicksLab Refund — ${refundNumber}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; background: #0D0D0D; color: #F5F0E8; padding: 32px; border-radius: 12px; border: 1px solid #2A2420;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #C9A96E; font-size: 28px; font-weight: 800; letter-spacing: 2px; margin: 0;">KICKSLAB</h1>
            <p style="color: #A89880; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Refund Department</p>
          </div>

          <h2 style="color: #F87171; font-size: 20px; margin-top: 0;">Update Regarding Your Refund</h2>
          <p style="color: #D4CEB8; font-size: 15px;">Dear <strong>${customerName}</strong>,</p>
          <p style="color: #D4CEB8; font-size: 15px; margin-bottom: 20px;">
            Your refund request <strong>${refundNumber}</strong> ${orderNumber ? `for order <strong>#${orderNumber}</strong>` : ''} could not be completed through the payment provider at this time.
          </p>

          <div style="background: #141414; padding: 16px; border-radius: 8px; border: 1px solid #2A2420; margin-bottom: 20px; font-size: 13px;">
            <p style="margin: 4px 0; color: #D4CEB8;"><strong>Refund Reference:</strong> <span style="color: #C9A96E; font-weight: bold;">${refundNumber}</span></p>
            <p style="margin: 4px 0; color: #D4CEB8;"><strong>Status:</strong> Processing Review Required</p>
          </div>

          <p style="color: #D4CEB8; font-size: 14px; margin-bottom: 24px; line-height: 1.5;">
            Our team has been notified and will review the refund status with the payment processor. You will receive an update as soon as possible.
          </p>

          <hr style="border: 0; border-top: 1px solid #2A2420; margin: 32px 0 20px 0;" />
          <p style="color: #A89880; font-size: 12px; text-align: center; margin: 0;">
            KicksLab E-Commerce Store · Dire Dawa & Addis Ababa, Ethiopia
          </p>
        </div>
      `,
    });

    return { success: true, id: info.messageId };
  } catch (err: any) {
    console.error(`[Email Error] Failed to send refund failed email to ${to}:`, err.message || err);
    return { success: false, error: err.message || String(err) };
  }
}

interface RefundRejectedEmailProps {
  to: string;
  customerName: string;
  refundNumber: string;
  rejectionReason: string;
}

export async function sendRefundRejectedEmail({
  to,
  customerName,
  refundNumber,
  rejectionReason,
}: RefundRejectedEmailProps): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const sender = getSenderAddress();
    const transporter = createTransporter();

    console.log(`[Refund Email] Sending refund rejection email to ${to} for refund ${refundNumber}`);

    const info = await transporter.sendMail({
      from: sender,
      to,
      subject: `KicksLab — Refund Request Update [${refundNumber}]`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; background: #0D0D0D; color: #F5F0E8; padding: 32px; border-radius: 12px; border: 1px solid #2A2420;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #C9A96E; font-size: 28px; font-weight: 800; letter-spacing: 2px; margin: 0;">KICKSLAB</h1>
            <p style="color: #A89880; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Refund Department</p>
          </div>

          <h2 style="color: #F87171; font-size: 20px; margin-top: 0;">Refund Request Update</h2>
          <p style="color: #D4CEB8; font-size: 15px;">Dear <strong>${customerName}</strong>,</p>
          <p style="color: #D4CEB8; font-size: 15px; margin-bottom: 20px;">
            We have reviewed your refund request <strong>${refundNumber}</strong>. Unfortunately, we are unable to approve this request at this time.
          </p>

          <div style="background: #141414; padding: 16px; border-radius: 8px; border: 1px solid #F87171/30; margin-bottom: 20px; font-size: 13px;">
            <p style="margin: 4px 0; color: #D4CEB8;"><strong>Refund Reference:</strong> <span style="color: #C9A96E; font-weight: bold;">${refundNumber}</span></p>
            <p style="margin: 4px 0; color: #F87171;"><strong>Reason for Decision:</strong> ${rejectionReason}</p>
          </div>

          <p style="color: #D4CEB8; font-size: 14px; margin-bottom: 24px;">
            If you have questions regarding this decision, please reach out via our contact page.
          </p>

          <hr style="border: 0; border-top: 1px solid #2A2420; margin: 32px 0 20px 0;" />
          <p style="color: #A89880; font-size: 12px; text-align: center; margin: 0;">
            KicksLab E-Commerce Store · Dire Dawa & Addis Ababa, Ethiopia
          </p>
        </div>
      `,
    });

    return { success: true, id: info.messageId };
  } catch (err: any) {
    console.error(`[Email Error] Failed to send refund rejection email to ${to}:`, err.message || err);
    return { success: false, error: err.message || String(err) };
  }
}

// ─── ORDER FULFILLMENT & CANCELLATION NOTIFICATION EMAILS ───
interface OrderDeliveredProps {
  to: string;
  name: string;
  orderNumber: string;
  items: any[];
  total: number;
  paymentMethod?: string;
  paymentStatus?: string;
  baseUrl?: string;
  reviewUrl?: string;
}

export async function sendOrderDeliveredEmail({
  to,
  name,
  orderNumber,
  items,
  total,
  paymentMethod,
  paymentStatus,
  baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000",
  reviewUrl,
}: OrderDeliveredProps): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const sender = getSenderAddress();
    const transporter = createTransporter();
    const finalReviewUrl = reviewUrl || `${baseUrl}/account/reviews`;

    console.log(`[Email Service] Sending order delivered email for ${orderNumber} to ${to} (Review URL: ${finalReviewUrl})`);

    const isCOD = paymentMethod === "CASH_ON_DELIVERY" || paymentMethod === "COD";
    const displayPaymentMethod = isCOD ? "Cash on Delivery" : (paymentMethod || "Chapa");
    const displayPaymentStatus = isCOD && paymentStatus !== "PAID" ? "Payment pending" : (paymentStatus || "Paid");

    const itemsHtml = items
      .map(
        (i) => `
        <tr style="border-bottom: 1px solid #2A2420;">
          <td style="padding: 12px 0; color: #F5F0E8;">${i.name || i.product?.name || "Sneaker"} ${i.size ? `(Size ${i.size})` : ""}</td>
          <td style="padding: 12px 0; color: #A89880; text-align: center;">x${i.quantity || 1}</td>
          <td style="padding: 12px 0; color: #F5F0E8; text-align: right; font-weight: bold;">ETB ${((i.price || 0) * (i.quantity || 1)).toLocaleString()}</td>
        </tr>
      `
      )
      .join("");

    const info = await transporter.sendMail({
      from: sender,
      to,
      subject: `Your KicksLab Order Has Been Delivered! #${orderNumber} 📦`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; background: #0D0D0D; color: #F5F0E8; padding: 32px; border-radius: 12px; border: 1px solid #2A2420;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #C9A96E; font-size: 28px; font-weight: 800; margin: 0;">KICKSLAB</h1>
            <p style="color: #4ADE80; font-size: 14px; font-weight: bold; margin-top: 6px;">✓ Package Delivered</p>
          </div>

          <p style="color: #D4CEB8; font-size: 15px;">Hi <strong>${name}</strong>,</p>
          <p style="color: #D4CEB8; font-size: 15px; margin-bottom: 24px;">
            Great news! Your order <strong>#${orderNumber}</strong> has been successfully delivered. We hope you love your new footwear!
          </p>

          <div style="background: #141414; padding: 20px; border-radius: 8px; border: 1px solid #2A2420; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #D4CEB8; margin-bottom: 16px; border-bottom: 1px solid #2A2420; padding-bottom: 12px;">
              <tr>
                <td style="padding: 4px 0;"><strong>Payment Method:</strong></td>
                <td style="text-align: right; color: #F5F0E8;">${displayPaymentMethod}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Payment Status:</strong></td>
                <td style="text-align: right; color: ${isCOD && paymentStatus !== 'PAID' ? '#FBBF24' : '#4ADE80'}; font-weight: bold;">${displayPaymentStatus}</td>
              </tr>
            </table>

            <h3 style="color: #F5F0E8; font-size: 15px; margin-top: 0; border-bottom: 1px solid #2A2420; padding-bottom: 8px;">Delivered Items</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <div style="text-align: right; margin-top: 14px; font-size: 15px; font-weight: bold; color: #C9A96E;">
              Total: ETB ${total.toLocaleString()}
            </div>
          </div>

          <div style="background: #1A1A1A; border: 1px solid #C9A96E/40; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <h4 style="color: #C9A96E; font-size: 16px; margin: 0 0 8px 0;">Share Your Experience ⭐</h4>
            <p style="color: #D4CEB8; font-size: 13px; margin: 0 0 16px 0;">
              Help fellow sneaker enthusiasts by writing a verified buyer review.
            </p>
            <a href="${finalReviewUrl}" style="background: #C9A96E; color: #0D0D0D; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Write a Review →</a>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${baseUrl}/track-order" style="color: #A89880; font-size: 13px; text-decoration: underline;">View Order Tracking Details</a>
          </div>

          <hr style="border: 0; border-top: 1px solid #2A2420; margin: 32px 0 20px 0;" />
          <p style="color: #A89880; font-size: 12px; text-align: center; margin: 0;">
            KicksLab · Premium Footwear Boutique · info@kickslab.com
          </p>
        </div>
      `,
    });

    if (info.messageId) {
      console.log(`[Email Service] Delivered delivery confirmation for ${orderNumber}. Message ID: ${info.messageId}`);
      return { success: true, id: info.messageId };
    }

    return { success: false, error: "No message ID returned by Gmail SMTP" };
  } catch (err: any) {
    console.error(`[Email Service Error] Failed to send delivery email for ${orderNumber} to ${to}:`, err.message || err);
    return { success: false, error: err.message || String(err) };
  }
}

interface OrderCancelledProps {
  to: string;
  name: string;
  orderNumber: string;
  items: any[];
  total: number;
  paymentStatus?: string;
  paymentMethod?: string;
  reason?: string;
  baseUrl?: string;
}

export async function sendOrderCancelledEmail({
  to,
  name,
  orderNumber,
  items,
  total,
  paymentStatus = "PENDING",
  paymentMethod = "Chapa",
  reason,
  baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000",
}: OrderCancelledProps): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const sender = getSenderAddress();
    const transporter = createTransporter();

    console.log(`[Email Service] Sending order cancellation email for ${orderNumber} to ${to}`);

    const itemsHtml = items
      .map(
        (i) => `
        <tr style="border-bottom: 1px solid #2A2420;">
          <td style="padding: 12px 0; color: #F5F0E8;">${i.name || i.product?.name || "Sneaker"} ${i.size ? `(Size ${i.size})` : ""}</td>
          <td style="padding: 12px 0; color: #A89880; text-align: center;">x${i.quantity || 1}</td>
          <td style="padding: 12px 0; color: #F5F0E8; text-align: right; font-weight: bold;">ETB ${((i.price || 0) * (i.quantity || 1)).toLocaleString()}</td>
        </tr>
      `
      )
      .join("");

    const isPaid = paymentStatus === "PAID";

    const info = await transporter.sendMail({
      from: sender,
      to,
      subject: `Order Cancelled #${orderNumber} — KicksLab`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; background: #0D0D0D; color: #F5F0E8; padding: 32px; border-radius: 12px; border: 1px solid #2A2420;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #C9A96E; font-size: 28px; font-weight: 800; margin: 0;">KICKSLAB</h1>
            <p style="color: #F87171; font-size: 14px; font-weight: bold; margin-top: 6px;">✕ Order Cancelled</p>
          </div>

          <p style="color: #D4CEB8; font-size: 15px;">Hi <strong>${name}</strong>,</p>
          <p style="color: #D4CEB8; font-size: 15px; margin-bottom: 24px;">
            Your order <strong>#${orderNumber}</strong> has been cancelled.
            ${reason ? `<br /><strong>Reason:</strong> ${reason}` : ""}
          </p>

          <div style="background: #141414; padding: 20px; border-radius: 8px; border: 1px solid #2A2420; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #D4CEB8; margin-bottom: 12px;">
              <tr>
                <td style="padding: 4px 0;"><strong>Order Number:</strong></td>
                <td style="text-align: right; color: #F5F0E8; font-weight: bold;">#${orderNumber}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Fulfillment Status:</strong></td>
                <td style="text-align: right; color: #F87171; font-weight: bold;">CANCELLED</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Payment Method:</strong></td>
                <td style="text-align: right; color: #F5F0E8;">${paymentMethod}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Payment Status:</strong></td>
                <td style="text-align: right; color: ${isPaid ? '#4ADE80' : '#A89880'}; font-weight: bold;">${paymentStatus}</td>
              </tr>
            </table>

            <h4 style="color: #F5F0E8; font-size: 14px; border-top: 1px solid #2A2420; padding-top: 12px; margin-bottom: 8px;">Cancelled Items</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <div style="text-align: right; margin-top: 14px; font-size: 15px; font-weight: bold; color: #C9A96E;">
              Total: ETB ${total.toLocaleString()}
            </div>
          </div>

          ${
            isPaid
              ? `
          <div style="background: #141414; border: 1px solid #2A2420; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #F5F0E8; font-size: 13px; margin: 0 0 6px 0; font-weight: bold;">Payment Notice:</p>
            <p style="color: #D4CEB8; font-size: 13px; margin: 0; line-height: 1.5;">
              Since your payment was already completed via ${paymentMethod}, any eligible refund will be processed in accordance with our store refund policy. You can request or track your refund status directly from your order page.
            </p>
          </div>
          `
              : ""
          }

          <div style="text-align: center; margin: 28px 0;">
            <a href="${baseUrl}/shop" style="background: #C9A96E; color: #0D0D0D; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Continue Shopping →</a>
          </div>

          <hr style="border: 0; border-top: 1px solid #2A2420; margin: 32px 0 20px 0;" />
          <p style="color: #A89880; font-size: 12px; text-align: center; margin: 0;">
            KicksLab · Premium Footwear Boutique · info@kickslab.com
          </p>
        </div>
      `,
    });

    if (info.messageId) {
      console.log(`[Email Service] Delivered cancellation email for ${orderNumber}. Message ID: ${info.messageId}`);
      return { success: true, id: info.messageId };
    }

    return { success: false, error: "No message ID returned by Gmail SMTP" };
  } catch (err: any) {
    console.error(`[Email Service Error] Failed to send cancellation email for ${orderNumber} to ${to}:`, err.message || err);
    return { success: false, error: err.message || String(err) };
  }
}

