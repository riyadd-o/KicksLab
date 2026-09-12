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

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "month";
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const now = new Date();
    let startDate: Date;
    let endDate = new Date();

    // Determine date range
    if (range === "week") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "3months") {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "year") {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "all") {
      startDate = new Date(2020, 0, 1);
    } else if (range === "custom" && fromParam) {
      startDate = new Date(fromParam);
      startDate.setHours(0, 0, 0, 0);
      if (toParam) {
        endDate = new Date(toParam);
        endDate.setHours(23, 59, 59, 999);
      }
    } else {
      // Default: This month (last 30 days)
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    // Fetch orders within date range including items and product relation
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // 1. Overall Summary Metrics
    const validOrders = orders.filter(
      (o) => o.status !== "CANCELLED" && o.status !== "REFUNDED"
    );
    const totalRevenue = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === "DELIVERED").length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / (validOrders.length || 1)) : 0;

    let totalUnitsSold = 0;
    validOrders.forEach((o) => {
      o.items.forEach((item) => {
        totalUnitsSold += item.quantity || 1;
      });
    });

    // 2. Orders by Status
    const statusMap: Record<string, number> = {};
    orders.forEach((o) => {
      const s = o.status || "PENDING";
      statusMap[s] = (statusMap[s] || 0) + 1;
    });
    const statusData = Object.keys(statusMap).map((key) => ({
      name: key,
      value: statusMap[key],
    }));

    // 3. Revenue Over Time (Dynamic grouping based on range)
    const timelineMap = new Map<string, { name: string; revenue: number; orders: number; dateKey: string }>();

    if (range === "week" || range === "month") {
      // Group by Day (e.g., "Sep 10")
      const curr = new Date(startDate);
      while (curr <= endDate) {
        const dateKey = curr.toISOString().split("T")[0];
        const label = curr.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        timelineMap.set(dateKey, { name: label, revenue: 0, orders: 0, dateKey });
        curr.setDate(curr.getDate() + 1);
      }

      validOrders.forEach((o) => {
        const dKey = o.createdAt.toISOString().split("T")[0];
        if (timelineMap.has(dKey)) {
          const entry = timelineMap.get(dKey)!;
          entry.revenue += o.total || 0;
          entry.orders += 1;
        }
      });
    } else {
      // Group by Month (e.g., "Jan 2026")
      const curr = new Date(startDate);
      curr.setDate(1);
      while (curr <= endDate) {
        const monthKey = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, "0")}`;
        const label = curr.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        timelineMap.set(monthKey, { name: label, revenue: 0, orders: 0, dateKey: monthKey });
        curr.setMonth(curr.getMonth() + 1);
      }

      validOrders.forEach((o) => {
        const mKey = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, "0")}`;
        if (timelineMap.has(mKey)) {
          const entry = timelineMap.get(mKey)!;
          entry.revenue += o.total || 0;
          entry.orders += 1;
        }
      });
    }

    const revenueData = Array.from(timelineMap.values());

    // 4. Top Products by Revenue and Units
    const productStatsMap = new Map<string, { name: string; revenue: number; units: number; image?: string }>();

    validOrders.forEach((o) => {
      o.items.forEach((item) => {
        const key = item.name || item.productId || "Unknown Product";
        const current = productStatsMap.get(key) || {
          name: key,
          revenue: 0,
          units: 0,
          image: item.image,
        };
        current.revenue += (item.price || 0) * (item.quantity || 1);
        current.units += item.quantity || 1;
        if (!current.image && item.image) current.image = item.image;
        productStatsMap.set(key, current);
      });
    });

    const topProducts = Array.from(productStatsMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // 5. Sales by Category
    const categoryStatsMap = new Map<string, { name: string; sales: number; revenue: number }>();

    validOrders.forEach((o) => {
      o.items.forEach((item) => {
        const cat = item.product?.category || "Footwear";
        const current = categoryStatsMap.get(cat) || { name: cat, sales: 0, revenue: 0 };
        current.sales += item.quantity || 1;
        current.revenue += (item.price || 0) * (item.quantity || 1);
        categoryStatsMap.set(cat, current);
      });
    });

    const categoryData = Array.from(categoryStatsMap.values()).sort(
      (a, b) => b.sales - a.sales
    );

    // 6. Recent Detailed Orders for Export and Table
    const orderDetails = orders.map((o) => ({
      orderNumber: o.orderNumber,
      date: o.createdAt.toISOString().split("T")[0],
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      city: o.city,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      status: o.status,
      itemsCount: o.items.reduce((sum, it) => sum + it.quantity, 0),
      total: o.total,
    }));

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalOrders,
        completedOrders,
        averageOrderValue,
        totalUnitsSold,
      },
      revenueData,
      statusData,
      topProducts,
      categoryData,
      orderDetails,
    });
  } catch (error: any) {
    console.error("[Admin Reports Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate sales reports." },
      { status: 500 }
    );
  }
}
