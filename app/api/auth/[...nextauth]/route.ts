import { handlers } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const res = await handlers.GET(req);
    return res;
  } catch (error) {
    console.error("[NextAuth GET Handler Error]:", error);
    return NextResponse.json(null, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const res = await handlers.POST(req);
    return res;
  } catch (error) {
    console.error("[NextAuth POST Handler Error]:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
