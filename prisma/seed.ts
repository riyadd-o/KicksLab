import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Starting seed...");

  // Hash password for admin
  const adminHash = await bcrypt.hash("000", 12);
  const adminVerify = await bcrypt.compare("000", adminHash);

  console.log("Admin hash verify:", adminVerify);
  if (!adminVerify) {
    throw new Error("BCRYPT VERIFICATION FAILED — do not save to DB");
  }

  // Delete existing admin users first to avoid conflicts
  await prisma.user.deleteMany({
    where: {
      OR: [
        { role: "ADMIN" },
        { email: { in: ["admin@kickslab.com", "admin@b.com"] } }
      ]
    }
  });

  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "admin@kickslab.com";

  // Create admin
  const admin = await prisma.user.create({
    data: {
      name:          "KicksLab Admin",
      email:         adminEmail,
      password:      adminHash,
      plainPassword: "000",
      role:          "ADMIN",
    },
  });
  console.log("Created admin:", admin.email);

  // Seed default promotion
  await prisma.promotion.upsert({
    where:  { id: "singleton" },
    update: {},
    create: {
      id:            "singleton",
      bannerActive:  true,
      bannerText:    "🖤 Black Friday — Up to 50% Off Sitewide",
      buttonText:    "SHOP NOW",
      bannerLink:    "/shop",
    },
  });
  console.log("Seeded promotion");

  // Seed default shipping settings
  await prisma.shippingSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      freeShippingEnabled: true,
      freeShippingThreshold: 5000,
    },
  });
  console.log("Seeded shipping settings");

  // Seed default shipping zones
  const defaultZones = [
    { name: "Dire Dawa", city: "Dire Dawa", fee: 100, active: true },
    { name: "Addis Ababa", city: "Addis Ababa", fee: 150, active: true },
    { name: "Regional Delivery", city: "Regional Delivery", fee: 200, active: true },
  ];

  for (const z of defaultZones) {
    const existing = await prisma.shippingZone.findFirst({
      where: { name: z.name },
    });
    if (!existing) {
      await prisma.shippingZone.create({ data: z });
    }
  }
  console.log("Seeded shipping zones");

  console.log("Seed complete ✓ (Products are managed via Admin panel)");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
