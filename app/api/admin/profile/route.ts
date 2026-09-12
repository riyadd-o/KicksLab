import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const userId = session.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Fetch admin profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const userId = session.id;

  try {
    const { name, currentPassword, newPassword } = await req.json();
    const updateData: any = {};

    if (name) updateData.name = name;

    if (newPassword) {
      if (currentPassword) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
          return NextResponse.json(
            { error: "Current password is incorrect." },
            { status: 400 }
          );
        }
      }
      updateData.password = await bcrypt.hash(newPassword, 12);
      updateData.plainPassword = newPassword;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updated,
    });
  } catch (error) {
    console.error("Admin profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile." },
      { status: 500 }
    );
  }
}
