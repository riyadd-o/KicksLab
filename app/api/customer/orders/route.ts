import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getCustomerSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: session.id,
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Fetch customer orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}
