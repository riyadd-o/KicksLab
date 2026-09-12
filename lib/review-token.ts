import { SignJWT, jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "kicks_lab_shoes_shop_secret_key_2026_isolated"
);

export interface GuestReviewTokenPayload {
  orderId: string;
  orderNumber: string;
  email: string;
  productId?: string;
  purpose: "guest_review";
}

/**
 * Generate a cryptographically signed, expiring token for guest product reviews.
 * Valid for 30 days after order delivery.
 */
export async function generateGuestReviewToken(
  payload: Omit<GuestReviewTokenPayload, "purpose">
): Promise<string> {
  return new SignJWT({
    orderId: payload.orderId,
    orderNumber: payload.orderNumber,
    email: payload.email.toLowerCase().trim(),
    productId: payload.productId,
    purpose: "guest_review",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET_KEY);
}

/**
 * Verify a guest review token.
 * Returns payload if valid, or null if expired/tampered.
 */
export async function verifyGuestReviewToken(
  token: string
): Promise<GuestReviewTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    if (payload.purpose !== "guest_review") {
      return null;
    }
    return {
      orderId: payload.orderId as string,
      orderNumber: payload.orderNumber as string,
      email: (payload.email as string).toLowerCase().trim(),
      productId: payload.productId as string | undefined,
      purpose: "guest_review",
    };
  } catch (error) {
    return null;
  }
}
