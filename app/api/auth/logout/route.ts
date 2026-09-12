import { NextResponse } from "next/server";
import { clearCustomerCookie } from "@/lib/session";

export async function POST() {
  const res = NextResponse.json({ success: true });
  clearCustomerCookie(res);
  return res;
}
