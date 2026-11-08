import { PrismaClient } from "@prisma/client";

// Ensure DATABASE_URL is always a valid SQLite file protocol for SQLite provider.
// Note: In Prisma SQLite, relative paths starting with './' are resolved relative to the schema.prisma directory (./prisma).
// Therefore, 'file:./dev.db' points correctly to 'prisma/dev.db'.
// If 'file:./prisma/dev.db' is passed, Prisma looks for 'prisma/prisma/dev.db' which fails with SQLite Error 14.
if (
  !process.env.DATABASE_URL ||
  !process.env.DATABASE_URL.startsWith("file:") ||
  process.env.DATABASE_URL.includes("prisma/dev.db")
) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

let schemaEnsured = false;

export async function ensureDatabaseSchema() {
  if (schemaEnsured) return;

  try {
    // 1. Ensure all core tables exist in SQLite
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "chat_sessions" (
        "id" TEXT PRIMARY KEY,
        "device_id" TEXT UNIQUE NOT NULL,
        "user_name" TEXT NOT NULL,
        "last_ip" TEXT,
        "user_agent" TEXT,
        "locked_until" DATETIME,
        "lock_reason" TEXT,
        "return_handled" BOOLEAN NOT NULL DEFAULT 0,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "chat_messages" (
        "id" TEXT PRIMARY KEY,
        "session_id" TEXT NOT NULL,
        "sender" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "metadata" JSON,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("session_id") REFERENCES "chat_sessions" ("id") ON DELETE CASCADE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" TEXT PRIMARY KEY,
        "session_id" TEXT NOT NULL,
        "external_id" TEXT,
        "amount" REAL NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "paid_at" DATETIME,
        "delivery_link" TEXT,
        "pix_code" TEXT,
        "pix_qr_code_url" TEXT,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("session_id") REFERENCES "chat_sessions" ("id") ON DELETE CASCADE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "app_configs" (
        "id" TEXT PRIMARY KEY DEFAULT 'global',
        "ai_base_url" TEXT NOT NULL DEFAULT 'https://api.deepseek.com',
        "ai_api_key" TEXT NOT NULL DEFAULT '',
        "ai_model" TEXT NOT NULL DEFAULT 'deepseek-chat',
        "ai_temperature" REAL NOT NULL DEFAULT 0.75,
        "system_prompt" TEXT NOT NULL DEFAULT '',
        "agent_name" TEXT NOT NULL DEFAULT 'Gabriel Siqueira',
        "agent_avatar" TEXT NOT NULL DEFAULT '',
        "product_name" TEXT NOT NULL DEFAULT 'Método Alta Conversão',
        "product_price" REAL NOT NULL DEFAULT 97.0,
        "product_delivery_link" TEXT NOT NULL DEFAULT 'https://seusite.com/download/acesso-vip',
        "payment_gateway" TEXT NOT NULL DEFAULT 'simulated',
        "payment_gateway_token" TEXT NOT NULL DEFAULT '',
        "payment_webhook_secret" TEXT NOT NULL DEFAULT '',
        "media_catalog" TEXT NOT NULL DEFAULT '[]',
        "media_instructions" TEXT NOT NULL DEFAULT '',
        "max_agent_photos" INTEGER NOT NULL DEFAULT 3,
        "post_purchase_minutes" INTEGER NOT NULL DEFAULT 10,
        "non_purchase_minutes" INTEGER NOT NULL DEFAULT 15,
        "cooldown_hours" INTEGER NOT NULL DEFAULT 24,
        "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Ensure all columns exist (in case of an older database schema)
    const alterCommands = [
      `ALTER TABLE "app_configs" ADD COLUMN "agent_avatar" TEXT DEFAULT ''`,
      `ALTER TABLE "app_configs" ADD COLUMN "post_purchase_minutes" INTEGER DEFAULT 10`,
      `ALTER TABLE "app_configs" ADD COLUMN "non_purchase_minutes" INTEGER DEFAULT 15`,
      `ALTER TABLE "app_configs" ADD COLUMN "cooldown_hours" INTEGER DEFAULT 24`,
      `ALTER TABLE "chat_sessions" ADD COLUMN "locked_until" DATETIME`,
      `ALTER TABLE "chat_sessions" ADD COLUMN "lock_reason" TEXT`,
      `ALTER TABLE "chat_sessions" ADD COLUMN "return_handled" BOOLEAN DEFAULT 0`,
    ];

    for (const sql of alterCommands) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch {
        // Column already exists, safe to ignore
      }
    }

    schemaEnsured = true;
  } catch (err) {
    console.warn("ensureDatabaseSchema note:", err);
  }
}
