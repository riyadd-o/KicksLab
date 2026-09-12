import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role"); // USER or STAFF or ADMIN

    const users = await prisma.user.findMany({
      where: role ? { role: role as any } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name, email, password, role } = await req.json();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: role || "STAFF",
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { email, name, password, role } = await req.json();

    let dataToUpdate: any = { name, role };
    if (password && password.trim() !== '') {
      dataToUpdate.password = await bcrypt.hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { email },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
