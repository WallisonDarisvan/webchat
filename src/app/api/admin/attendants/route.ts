import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabaseSchema } from "@/lib/prisma";
import { DEFAULT_CONFIG, DEFAULT_SYSTEM_PROMPT, DEFAULT_MEDIA_INSTRUCTIONS } from "@/lib/config";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";
const COOKIE_NAME = "admin_auth_token";

function isAuthorized(req: NextRequest): boolean {
  const cookie = req.cookies.get(COOKIE_NAME);
  const expected = "authenticated_" + Buffer.from(ADMIN_PASSWORD).toString("base64");
  return cookie?.value === expected;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    await ensureDatabaseSchema();
    const attendants = await prisma.attendant.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: {
            sessions: true,
            orders: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, attendants });
  } catch (error) {
    console.error("Error in GET /api/admin/attendants:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const name = body.name?.trim() || "Novo Atendente";
    let slug = slugify(body.slug?.trim() || name);

    if (!slug) {
      slug = "atendente-" + Math.random().toString(36).substring(2, 6);
    }

    // Check slug uniqueness
    const existing = await prisma.attendant.findUnique({
      where: { slug },
    });

    if (existing) {
      slug = `${slug}-${Math.floor(Math.random() * 900 + 100)}`;
    }

    const newAttendant = await prisma.attendant.create({
      data: {
        name,
        slug,
        avatar: body.avatar || "",
        bio: body.bio || "Especialista em Vendas e Atendimento",
        isActive: true,
        aiBaseUrl: body.aiBaseUrl || DEFAULT_CONFIG.aiBaseUrl,
        aiApiKey: body.aiApiKey || "",
        aiModel: body.aiModel || DEFAULT_CONFIG.aiModel,
        aiTemperature: typeof body.aiTemperature === "number" ? body.aiTemperature : 0.75,
        systemPrompt: body.systemPrompt || DEFAULT_SYSTEM_PROMPT,
        productName: body.productName || "Método Alta Conversão",
        productPrice: typeof body.productPrice === "number" ? body.productPrice : 97.0,
        productDeliveryLink: body.productDeliveryLink || "https://seusite.com/download/acesso-vip",
        paymentGateway: body.paymentGateway || "simulated",
        paymentGatewayToken: body.paymentGatewayToken || "",
        paymentWebhookSecret: body.paymentWebhookSecret || "",
        mediaCatalog: body.mediaCatalog || "[]",
        mediaInstructions: body.mediaInstructions || DEFAULT_MEDIA_INSTRUCTIONS,
        maxAgentPhotos: body.maxAgentPhotos ?? 3,
        postPurchaseMinutes: body.postPurchaseMinutes ?? 10,
        nonPurchaseMinutes: body.nonPurchaseMinutes ?? 15,
        cooldownHours: body.cooldownHours ?? 24,
      },
    });

    return NextResponse.json({ success: true, attendant: newAttendant });
  } catch (error) {
    console.error("Error creating attendant:", error);
    const msg = error instanceof Error ? error.message : "Erro ao criar atendente";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
