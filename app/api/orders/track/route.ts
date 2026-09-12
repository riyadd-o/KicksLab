import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const email = searchParams.get('email');

    if (!orderId || !email) {
      return NextResponse.json({ error: "Order ID and email are required." }, { status: 400 });
    }

    const cleanOrderId = String(orderId).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: cleanOrderId,
        customerEmail: { equals: cleanEmail, mode: "insensitive" },
      },
      include: { items: true, refund: true },
    });

    if (!order) {
      return NextResponse.json({ error: "No order found with this ID and email combination." }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("GET /api/orders/track error:", error);
    return NextResponse.json({ error: "Failed to track order." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, email } = body;

    if (!orderId || !email) {
      return NextResponse.json({ error: "Order ID and email are required." }, { status: 400 });
    }

    const cleanOrderId = String(orderId).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: cleanOrderId,
        customerEmail: { equals: cleanEmail, mode: "insensitive" },
      },
      include: { items: true, refund: true },
    });

    if (!order) {
      return NextResponse.json({ error: "No order found with this ID and email combination." }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("POST /api/orders/track error:", error);
    return NextResponse.json({ error: "Failed to track order." }, { status: 500 });
  }
}
