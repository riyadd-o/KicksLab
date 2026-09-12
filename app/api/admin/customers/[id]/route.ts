import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true };
}>;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await getAdminSession(req);
    if (!adminSession || adminSession.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findFirst({
      where: {
        id,
        role: "USER",
      },
      select: {
        id: true,
        memberId: true,
        name: true,
        email: true,
        phone: true,
        gender: true,
        country: true,
        city: true,
        streetAddress: true,
        address: true,
        postalCode: true,
        role: true,
        createdAt: true,
        savedAddresses: {
          orderBy: [
            { isDefault: "desc" },
            { createdAt: "desc" },
          ],
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    // Fetch all orders strictly associated with this customer's userId
    const orders: OrderWithItems[] = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute stats
    const totalOrders = orders.length;
    const paidOrders = orders.filter((o: OrderWithItems) => o.paymentStatus === "PAID").length;
    const pendingOrders = orders.filter((o: OrderWithItems) => o.status === "PENDING").length;
    const cancelledOrders = orders.filter((o: OrderWithItems) => o.status === "CANCELLED").length;
    const totalSpent = orders.reduce((sum: number, o: OrderWithItems) => sum + (o.total || 0), 0);

    return NextResponse.json({
      customer: user,
      stats: {
        totalOrders,
        paidOrders,
        pendingOrders,
        cancelledOrders,
        totalSpent,
      },
      orders,
    });
  } catch (error) {
    console.error("Admin fetch customer detail error:", error);
    return NextResponse.json({ error: "Failed to fetch customer details." }, { status: 500 });
  }
}
