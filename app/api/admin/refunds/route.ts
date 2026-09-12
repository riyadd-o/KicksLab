import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const refunds = await prisma.refund.findMany({
      orderBy: { createdAt: "desc" },
      include: { order: { include: { items: true } } }
    });

    return NextResponse.json(refunds);
  } catch (error) {
    console.error("GET /api/admin/refunds error:", error);
    return NextResponse.json({ error: "Failed to fetch refunds." }, { status: 500 });
  }
}
