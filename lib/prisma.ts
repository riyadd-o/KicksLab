import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as { 
  prisma: PrismaClient;
  pool: Pool;
};

if (!globalForPrisma.pool) {
  globalForPrisma.pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

// In development, if the cached Prisma instance was created before a schema change, invalidate it
if (process.env.NODE_ENV !== "production" && globalForPrisma.prisma) {
  try {
    if (!(globalForPrisma.prisma as any).couponUsage) {
      delete (globalForPrisma as any).prisma;
    }
  } catch (e) {
    delete (globalForPrisma as any).prisma;
  }
}

const adapter = new PrismaPg(globalForPrisma.pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter, log: ["query"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
