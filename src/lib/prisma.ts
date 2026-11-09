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
    log: ["warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

let schemaPromise: Promise<void> | null = null;

export async function ensureDatabaseSchema(): Promise<void> {
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    try {
    // 1. Ensure all core tables exist in SQLite
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "attendants" (
        "id" TEXT PRIMARY KEY,
        "slug" TEXT UNIQUE NOT NULL,
        "name" TEXT NOT NULL DEFAULT 'Gabriel Siqueira',
        "avatar" TEXT NOT NULL DEFAULT '',
        "bio" TEXT NOT NULL DEFAULT 'Especialista em Vendas e Atendimento',
        "is_active" BOOLEAN NOT NULL DEFAULT 1,
        "ai_base_url" TEXT NOT NULL DEFAULT 'https://api.deepseek.com',
        "ai_api_key" TEXT NOT NULL DEFAULT '',
        "ai_model" TEXT NOT NULL DEFAULT 'deepseek-chat',
        "ai_temperature" REAL NOT NULL DEFAULT 0.75,
        "system_prompt" TEXT NOT NULL DEFAULT '',
        "product_name" TEXT NOT NULL DEFAULT 'Método Alta Conversão',
        "product_price" REAL NOT NULL DEFAULT 97.0,
        "product_delivery_link" TEXT NOT NULL DEFAULT 'https://seusite.com/download/acesso-vip',
        "product_delivery_message" TEXT NOT NULL DEFAULT '',
        "payment_gateway" TEXT NOT NULL DEFAULT 'simulated',
        "payment_gateway_token" TEXT NOT NULL DEFAULT '',
        "payment_webhook_secret" TEXT NOT NULL DEFAULT '',
        "media_catalog" TEXT NOT NULL DEFAULT '[]',
        "media_instructions" TEXT NOT NULL DEFAULT '',
        "custom_tags" TEXT NOT NULL DEFAULT '[]',
        "max_agent_photos" INTEGER NOT NULL DEFAULT 3,
        "post_purchase_minutes" INTEGER NOT NULL DEFAULT 10,
        "non_purchase_minutes" INTEGER NOT NULL DEFAULT 15,
        "cooldown_hours" INTEGER NOT NULL DEFAULT 24,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "chat_sessions" (
        "id" TEXT PRIMARY KEY,
        "device_id" TEXT NOT NULL,
        "attendant_id" TEXT,
        "attendant_slug" TEXT,
        "user_name" TEXT NOT NULL,
        "last_ip" TEXT,
        "user_agent" TEXT,
        "locked_until" DATETIME,
        "lock_reason" TEXT,
        "return_handled" BOOLEAN NOT NULL DEFAULT 0,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("attendant_id") REFERENCES "attendants" ("id") ON DELETE SET NULL
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
        "attendant_id" TEXT,
        "attendant_slug" TEXT,
        "external_id" TEXT,
        "amount" REAL NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "paid_at" DATETIME,
        "delivery_link" TEXT,
        "pix_code" TEXT,
        "pix_qr_code_url" TEXT,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("session_id") REFERENCES "chat_sessions" ("id") ON DELETE CASCADE,
        FOREIGN KEY ("attendant_id") REFERENCES "attendants" ("id") ON DELETE SET NULL
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
        "product_delivery_message" TEXT NOT NULL DEFAULT '',
        "payment_gateway" TEXT NOT NULL DEFAULT 'simulated',
        "payment_gateway_token" TEXT NOT NULL DEFAULT '',
        "payment_webhook_secret" TEXT NOT NULL DEFAULT '',
        "media_catalog" TEXT NOT NULL DEFAULT '[]',
        "media_instructions" TEXT NOT NULL DEFAULT '',
        "custom_tags" TEXT NOT NULL DEFAULT '[]',
        "max_agent_photos" INTEGER NOT NULL DEFAULT 3,
        "post_purchase_minutes" INTEGER NOT NULL DEFAULT 10,
        "non_purchase_minutes" INTEGER NOT NULL DEFAULT 15,
        "cooldown_hours" INTEGER NOT NULL DEFAULT 24,
        "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Ensure all columns exist (checks table_info once per table to avoid duplicate column logs)
    const requiredColumns = [
      { table: "app_configs", column: "agent_avatar", sql: `ALTER TABLE "app_configs" ADD COLUMN "agent_avatar" TEXT DEFAULT ''` },
      { table: "app_configs", column: "post_purchase_minutes", sql: `ALTER TABLE "app_configs" ADD COLUMN "post_purchase_minutes" INTEGER DEFAULT 10` },
      { table: "app_configs", column: "non_purchase_minutes", sql: `ALTER TABLE "app_configs" ADD COLUMN "non_purchase_minutes" INTEGER DEFAULT 15` },
      { table: "app_configs", column: "cooldown_hours", sql: `ALTER TABLE "app_configs" ADD COLUMN "cooldown_hours" INTEGER DEFAULT 24` },
      { table: "chat_sessions", column: "locked_until", sql: `ALTER TABLE "chat_sessions" ADD COLUMN "locked_until" DATETIME` },
      { table: "chat_sessions", column: "lock_reason", sql: `ALTER TABLE "chat_sessions" ADD COLUMN "lock_reason" TEXT` },
      { table: "chat_sessions", column: "return_handled", sql: `ALTER TABLE "chat_sessions" ADD COLUMN "return_handled" BOOLEAN DEFAULT 0` },
      { table: "chat_sessions", column: "attendant_id", sql: `ALTER TABLE "chat_sessions" ADD COLUMN "attendant_id" TEXT` },
      { table: "chat_sessions", column: "attendant_slug", sql: `ALTER TABLE "chat_sessions" ADD COLUMN "attendant_slug" TEXT` },
      { table: "orders", column: "attendant_id", sql: `ALTER TABLE "orders" ADD COLUMN "attendant_id" TEXT` },
      { table: "orders", column: "attendant_slug", sql: `ALTER TABLE "orders" ADD COLUMN "attendant_slug" TEXT` },
      { table: "attendants", column: "bio", sql: `ALTER TABLE "attendants" ADD COLUMN "bio" TEXT DEFAULT 'Especialista em Vendas e Atendimento'` },
      { table: "attendants", column: "is_active", sql: `ALTER TABLE "attendants" ADD COLUMN "is_active" BOOLEAN DEFAULT 1` },
      { table: "attendants", column: "custom_tags", sql: `ALTER TABLE "attendants" ADD COLUMN "custom_tags" TEXT DEFAULT '[]'` },
      { table: "attendants", column: "product_delivery_message", sql: `ALTER TABLE "attendants" ADD COLUMN "product_delivery_message" TEXT DEFAULT ''` },
      { table: "app_configs", column: "custom_tags", sql: `ALTER TABLE "app_configs" ADD COLUMN "custom_tags" TEXT DEFAULT '[]'` },
      { table: "app_configs", column: "product_delivery_message", sql: `ALTER TABLE "app_configs" ADD COLUMN "product_delivery_message" TEXT DEFAULT ''` },
    ];

    const tables = ["app_configs", "chat_sessions", "orders", "attendants"];
    const existingTableColumns: Record<string, Set<string>> = {};

    for (const tbl of tables) {
      try {
        const cols = await prisma.$queryRawUnsafe<any[]>(`PRAGMA table_info("${tbl}")`);
        existingTableColumns[tbl] = new Set(cols.map((c: any) => c.name));
      } catch {
        existingTableColumns[tbl] = new Set();
      }
    }

    for (const item of requiredColumns) {
      if (!existingTableColumns[item.table]?.has(item.column)) {
        try {
          await prisma.$executeRawUnsafe(item.sql);
          existingTableColumns[item.table]?.add(item.column);
        } catch {
          // duplicate column or locked table, safe to ignore
        }
      }
    }

    // 3. Ensure at least one initial attendant exists and migrate from app_configs if needed
    try {
      const attendantsCount = await prisma.$queryRawUnsafe<any[]>(
        `SELECT COUNT(*) as cnt FROM "attendants"`
      );
      const count = Number(attendantsCount[0]?.cnt ?? attendantsCount[0]?.count ?? 0);

      if (count === 0) {
        // Try reading legacy app_configs
        const configs = await prisma.$queryRawUnsafe<any[]>(
          `SELECT * FROM "app_configs" WHERE id = 'global' LIMIT 1`
        );
        const legacy = configs[0] || {};

        const defaultId = "attendant-gabriel-siqueira";
        const defaultSlug = "gabriel";
        const defaultName = legacy.agent_name || "Gabriel Siqueira";
        const defaultAvatar = legacy.agent_avatar || "";
        const defaultAiBaseUrl = legacy.ai_base_url || "https://api.deepseek.com";
        const defaultAiApiKey = legacy.ai_api_key || "";
        const defaultAiModel = legacy.ai_model || "deepseek-chat";
        const defaultAiTemp = legacy.ai_temperature || 0.75;
        const defaultPrompt = legacy.system_prompt || "";
        const defaultProdName = legacy.product_name || "Método Alta Conversão";
        const defaultProdPrice = legacy.product_price || 97.0;
        const defaultProdLink = legacy.product_delivery_link || "https://seusite.com/download/acesso-vip";
        const defaultGateway = legacy.payment_gateway || "simulated";
        const defaultToken = legacy.payment_gateway_token || "";
        const defaultSecret = legacy.payment_webhook_secret || "";
        const defaultMediaCat = legacy.media_catalog || "[]";
        const defaultMediaInst = legacy.media_instructions || "";
        const defaultMaxPhotos = legacy.max_agent_photos || 3;
        const defaultPostMin = legacy.post_purchase_minutes || 10;
        const defaultNonMin = legacy.non_purchase_minutes || 15;
        const defaultCooldown = legacy.cooldown_hours || 24;

        await prisma.$executeRawUnsafe(`
          INSERT INTO "attendants" (
            "id", "slug", "name", "avatar", "bio", "is_active",
            "ai_base_url", "ai_api_key", "ai_model", "ai_temperature", "system_prompt",
            "product_name", "product_price", "product_delivery_link",
            "payment_gateway", "payment_gateway_token", "payment_webhook_secret",
            "media_catalog", "media_instructions", "max_agent_photos",
            "post_purchase_minutes", "non_purchase_minutes", "cooldown_hours"
          ) VALUES (
            '${defaultId}', '${defaultSlug}', '${defaultName.replace(/'/g, "''")}', '${defaultAvatar.replace(/'/g, "''")}', 'Especialista em Vendas e Atendimento', 1,
            '${defaultAiBaseUrl.replace(/'/g, "''")}', '${defaultAiApiKey.replace(/'/g, "''")}', '${defaultAiModel.replace(/'/g, "''")}', ${defaultAiTemp}, '${defaultPrompt.replace(/'/g, "''")}',
            '${defaultProdName.replace(/'/g, "''")}', ${defaultProdPrice}, '${defaultProdLink.replace(/'/g, "''")}',
            '${defaultGateway.replace(/'/g, "''")}', '${defaultToken.replace(/'/g, "''")}', '${defaultSecret.replace(/'/g, "''")}',
            '${defaultMediaCat.replace(/'/g, "''")}', '${defaultMediaInst.replace(/'/g, "''")}', ${defaultMaxPhotos},
            ${defaultPostMin}, ${defaultNonMin}, ${defaultCooldown}
          )
        `);

        // Associate existing legacy sessions to this default attendant
        await prisma.$executeRawUnsafe(`
          UPDATE "chat_sessions"
          SET "attendant_id" = '${defaultId}', "attendant_slug" = '${defaultSlug}'
          WHERE "attendant_id" IS NULL
        `);

        // Associate existing legacy orders to this default attendant
        await prisma.$executeRawUnsafe(`
          UPDATE "orders"
          SET "attendant_id" = '${defaultId}', "attendant_slug" = '${defaultSlug}'
          WHERE "attendant_id" IS NULL
        `);
      }
    } catch (seedErr) {
      console.warn("Seed initial attendant note:", seedErr);
    }

    } catch (err) {
      console.warn("ensureDatabaseSchema note:", err);
    }
  })();

  return schemaPromise;
}
