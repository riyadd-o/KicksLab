import { NextResponse } from "next/server";
import { getLiveLimitedDrop } from "@/lib/promotions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const activeDrop = await getLiveLimitedDrop();
    return NextResponse.json({ activeDrop, drop: activeDrop });
  } catch (error) {
    console.error("GET /api/limited-drops/active error:", error);
    return NextResponse.json({ error: "Failed to fetch active limited drop" }, { status: 500 });
  }
}
