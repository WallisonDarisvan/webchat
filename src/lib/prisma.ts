import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  schemaInitialized: boolean | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Ensures all required PostgreSQL tables and indexes exist automatically on first startup.
 * Prevents "table does not exist" errors on fresh database deployments.
 */
export async function ensureDatabaseSchema() {
  if (globalForPrisma.schemaInitialized) return;

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "chat_sessions" (
        "id" TEXT PRIMARY KEY,
        "device_id" TEXT UNIQUE NOT NULL,
        "user_name" TEXT NOT NULL,
        "last_ip" TEXT,
        "user_agent" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "chat_sessions_device_id_idx" ON "chat_sessions"("device_id");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "chat_messages" (
        "id" TEXT PRIMARY KEY,
        "session_id" TEXT NOT NULL REFERENCES "chat_sessions"("id") ON DELETE CASCADE,
        "sender" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "metadata" JSONB,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "chat_messages_session_id_idx" ON "chat_messages"("session_id");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" TEXT PRIMARY KEY,
        "session_id" TEXT NOT NULL REFERENCES "chat_sessions"("id") ON DELETE CASCADE,
        "external_id" TEXT,
        "amount" DECIMAL(10, 2) NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "paid_at" TIMESTAMP(3),
        "delivery_link" TEXT,
        "pix_code" TEXT,
        "pix_qr_code_url" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "orders_session_id_idx" ON "orders"("session_id");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "orders_external_id_idx" ON "orders"("external_id");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "app_configs" (
        "id" TEXT PRIMARY KEY DEFAULT 'global',
        "ai_base_url" TEXT NOT NULL DEFAULT 'https://api.deepseek.com',
        "ai_api_key" TEXT NOT NULL DEFAULT '',
        "ai_model" TEXT NOT NULL DEFAULT 'deepseek-chat',
        "ai_temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
        "system_prompt" TEXT NOT NULL DEFAULT '',
        "product_name" TEXT NOT NULL DEFAULT 'Método Alta Conversão',
        "product_price" DECIMAL(10, 2) NOT NULL DEFAULT 97.00,
        "product_delivery_link" TEXT NOT NULL DEFAULT 'https://seusite.com/download/acesso-vip',
        "payment_gateway" TEXT NOT NULL DEFAULT 'simulated',
        "payment_gateway_token" TEXT NOT NULL DEFAULT '',
        "payment_webhook_secret" TEXT NOT NULL DEFAULT '',
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    globalForPrisma.schemaInitialized = true;
    console.log("Database schema successfully ensured.");
  } catch (err) {
    console.warn("Notice: ensureDatabaseSchema encountered an error (or already initialized):", err);
  }
}
