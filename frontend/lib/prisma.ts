// frontend/lib/prisma.ts

// Import Pool from pg so we can connect to PostgreSQL
import { Pool } from "pg";

// Import PrismaPg adapter for Prisma 7 PostgreSQL connection
import { PrismaPg } from "@prisma/adapter-pg";

// Import PrismaClient from your generated Prisma client
import { PrismaClient } from "../src/generated/prisma/client";

// This tells TypeScript that we may store Prisma globally in development
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Create a PostgreSQL connection pool using your DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the Prisma adapter using the PostgreSQL pool
const adapter = new PrismaPg(pool);

// Reuse existing Prisma client if available, otherwise create a new one
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

// Save the Prisma client globally in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}