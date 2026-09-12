import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const adminSession = await getAdminSession(req);
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [totalOrders, pendingOrders, productsCount, revenueAggregate, recentOrders] = await Promise.all([
      // Total orders in the database
      prisma.order.count(),
      // Pending orders requiring fulfillment
      prisma.order.count({ where: { status: "PENDING" } }),
      // Active catalog products
      prisma.product.count(),
      // Total recognized revenue (excluding CANCELLED and REFUNDED, only PAID orders)
      prisma.order.aggregate({
        where: {
          status: { notIn: ["CANCELLED", "REFUNDED"] },
          paymentStatus: "PAID",
        },
        _sum: { total: true },
      }),
      // Top 5 recent orders
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { items: true },
      }),
    ]);

    return NextResponse.json({
      metrics: {
        totalOrders,
        totalRevenue: revenueAggregate._sum?.total || 0,
        products: productsCount,
        pendingOrders,
      },
      recentOrders: recentOrders || [],
    });
  } catch (error: any) {
    console.error("Admin dashboard fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard metrics." },
      { status: 500 }
    );
  }
}
