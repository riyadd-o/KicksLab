import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const adminSession = await getAdminSession(req);
    if (!adminSession || adminSession.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const filter = searchParams.get("filter") || "all"; // all, with_orders, no_orders
    const sortBy = searchParams.get("sortBy") || "createdAt"; // createdAt, name, orderCount, totalSpent
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));

    // Build Prisma query condition strictly for role = USER (excluding ADMIN and STAFF)
    const whereCondition: any = {
      role: "USER",
      NOT: [
        { role: "ADMIN" },
        { role: "STAFF" },
      ],
    };

    if (search) {
      whereCondition.OR = [
        { memberId: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Retrieve all matching USER records with their orders
    const allUsers = await prisma.user.findMany({
      where: whereCondition,
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
        createdAt: true,
        orders: {
          select: {
            id: true,
            total: true,
            createdAt: true,
            status: true,
          },
        },
      },
      orderBy: sortBy === "name" ? { name: sortOrder } : { createdAt: sortOrder },
    });

    // Format & calculate aggregates for each customer
    let formattedCustomers = allUsers.map((user) => {
      const orderCount = user.orders.length;
      const totalSpent = user.orders.reduce((sum, o) => sum + (o.total || 0), 0);
      const latestOrder = user.orders.length > 0
        ? user.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
        : null;

      return {
        id: user.id,
        memberId: user.memberId || 'N/A',
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        country: user.country || 'Ethiopia',
        city: user.city,
        streetAddress: user.streetAddress || user.address,
        address: user.address,
        postalCode: user.postalCode,
        createdAt: user.createdAt,
        orderCount,
        totalSpent,
        latestOrderDate: latestOrder,
      };
    });

    // Apply filtering by order presence
    if (filter === "with_orders") {
      formattedCustomers = formattedCustomers.filter((c) => c.orderCount > 0);
    } else if (filter === "no_orders") {
      formattedCustomers = formattedCustomers.filter((c) => c.orderCount === 0);
    }

    // Apply sorting for calculated fields
    if (sortBy === "orderCount") {
      formattedCustomers.sort((a, b) => sortOrder === "asc" ? a.orderCount - b.orderCount : b.orderCount - a.orderCount);
    } else if (sortBy === "totalSpent") {
      formattedCustomers.sort((a, b) => sortOrder === "asc" ? a.totalSpent - b.totalSpent : b.totalSpent - a.totalSpent);
    } else if (sortBy === "latestOrderDate") {
      formattedCustomers.sort((a, b) => {
        const timeA = a.latestOrderDate ? new Date(a.latestOrderDate).getTime() : 0;
        const timeB = b.latestOrderDate ? new Date(b.latestOrderDate).getTime() : 0;
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      });
    }

    // Overall stats for summary header (strictly USER role, excluding internal roles)
    const customerRoleFilter = {
      role: "USER" as const,
      NOT: [{ role: "ADMIN" as const }, { role: "STAFF" as const }],
    };

    const totalCustomersCount = await prisma.user.count({ where: customerRoleFilter });
    const customersWithOrdersCount = await prisma.user.count({
      where: {
        ...customerRoleFilter,
        orders: { some: {} },
      },
    });

    // Total revenue generated strictly by registered customers
    const customerOrdersAggregate = await prisma.order.aggregate({
      where: {
        user: customerRoleFilter,
      },
      _sum: { total: true },
    });

    // Server-side pagination slicing
    const totalMatching = formattedCustomers.length;
    const totalPages = Math.ceil(totalMatching / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedCustomers = formattedCustomers.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      customers: paginatedCustomers,
      pagination: {
        total: totalMatching,
        page,
        limit,
        totalPages,
      },
      stats: {
        totalCustomers: totalCustomersCount,
        activeCustomers: customersWithOrdersCount,
        totalCustomerRevenue: customerOrdersAggregate._sum.total || 0,
      },
    });
  } catch (error) {
    console.error("Admin customers fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch customers." }, { status: 500 });
  }
}
