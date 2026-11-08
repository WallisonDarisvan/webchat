import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabaseSchema } from "@/lib/prisma";
import { getAppConfig } from "@/lib/config";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";
const COOKIE_NAME = "admin_auth_token";

function isAuthorized(req: NextRequest): boolean {
  const cookie = req.cookies.get(COOKIE_NAME);
  const expected = "authenticated_" + Buffer.from(ADMIN_PASSWORD).toString("base64");
  return cookie?.value === expected;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const attendantId = searchParams.get("attendantId") || searchParams.get("slug") || undefined;
    const config = await getAppConfig(attendantId);
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("Error in GET /api/admin/config:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    await ensureDatabaseSchema();
    const data = await req.json();
    const attendantId = data.attendantId || data.id;

    // If attendantId refers to an attendant, update that attendant record
    const existingAttendant = attendantId
      ? await prisma.attendant.findFirst({
          where: {
            OR: [{ id: attendantId }, { slug: attendantId }],
          },
        })
      : await prisma.attendant.findFirst({ orderBy: { createdAt: "asc" } });

    if (existingAttendant) {
      const updatedAttendant = await prisma.attendant.update({
        where: { id: existingAttendant.id },
        data: {
          name: data.agentName || data.name || existingAttendant.name,
          slug: data.slug || existingAttendant.slug,
          avatar: typeof data.agentAvatar !== "undefined" ? data.agentAvatar : data.avatar ?? existingAttendant.avatar,
          bio: data.bio ?? existingAttendant.bio,
          isActive: typeof data.isActive !== "undefined" ? Boolean(data.isActive) : existingAttendant.isActive,
          aiBaseUrl: data.aiBaseUrl ?? existingAttendant.aiBaseUrl,
          aiApiKey: data.aiApiKey ?? existingAttendant.aiApiKey,
          aiModel: data.aiModel ?? existingAttendant.aiModel,
          aiTemperature: typeof data.aiTemperature !== "undefined" ? parseFloat(data.aiTemperature) : existingAttendant.aiTemperature,
          systemPrompt: data.systemPrompt ?? existingAttendant.systemPrompt,
          productName: data.productName ?? existingAttendant.productName,
          productPrice: typeof data.productPrice !== "undefined" ? parseFloat(data.productPrice) : existingAttendant.productPrice,
          productDeliveryLink: data.productDeliveryLink ?? existingAttendant.productDeliveryLink,
          paymentGateway: data.paymentGateway ?? existingAttendant.paymentGateway,
          paymentGatewayToken: data.paymentGatewayToken ?? existingAttendant.paymentGatewayToken,
          paymentWebhookSecret: data.paymentWebhookSecret ?? existingAttendant.paymentWebhookSecret,
          mediaCatalog: typeof data.mediaCatalog === "string" ? data.mediaCatalog : JSON.stringify(data.mediaCatalog || []),
          mediaInstructions: data.mediaInstructions ?? existingAttendant.mediaInstructions,
          maxAgentPhotos: typeof data.maxAgentPhotos !== "undefined" ? parseInt(data.maxAgentPhotos) : existingAttendant.maxAgentPhotos,
          postPurchaseMinutes: typeof data.postPurchaseMinutes !== "undefined" ? parseInt(data.postPurchaseMinutes) : existingAttendant.postPurchaseMinutes,
          nonPurchaseMinutes: typeof data.nonPurchaseMinutes !== "undefined" ? parseInt(data.nonPurchaseMinutes) : existingAttendant.nonPurchaseMinutes,
          cooldownHours: typeof data.cooldownHours !== "undefined" ? parseInt(data.cooldownHours) : existingAttendant.cooldownHours,
        },
      });

      return NextResponse.json({
        success: true,
        config: {
          ...updatedAttendant,
          agentName: updatedAttendant.name,
          agentAvatar: updatedAttendant.avatar,
          productPrice: Number(updatedAttendant.productPrice),
        },
      });
    }

    // Fallback: update legacy app_configs
    const updated = await prisma.appConfig.upsert({
      where: { id: "global" },
      update: {
        aiBaseUrl: data.aiBaseUrl,
        aiApiKey: data.aiApiKey,
        aiModel: data.aiModel,
        aiTemperature: parseFloat(data.aiTemperature) || 0.75,
        systemPrompt: data.systemPrompt,
        agentName: data.agentName || "Gabriel Siqueira",
        agentAvatar: data.agentAvatar || "",
        productName: data.productName,
        productPrice: parseFloat(data.productPrice) || 97.0,
        productDeliveryLink: data.productDeliveryLink,
        paymentGateway: data.paymentGateway || "simulated",
        paymentGatewayToken: data.paymentGatewayToken || "",
        paymentWebhookSecret: data.paymentWebhookSecret || "",
        mediaCatalog: typeof data.mediaCatalog === "string" ? data.mediaCatalog : JSON.stringify(data.mediaCatalog || []),
        mediaInstructions: data.mediaInstructions ?? "",
        maxAgentPhotos: typeof data.maxAgentPhotos !== "undefined" ? parseInt(data.maxAgentPhotos) || 0 : 3,
        postPurchaseMinutes: typeof data.postPurchaseMinutes !== "undefined" ? parseInt(data.postPurchaseMinutes) || 10 : 10,
        nonPurchaseMinutes: typeof data.nonPurchaseMinutes !== "undefined" ? parseInt(data.nonPurchaseMinutes) || 15 : 15,
        cooldownHours: typeof data.cooldownHours !== "undefined" ? parseInt(data.cooldownHours) || 24 : 24,
      },
      create: {
        id: "global",
        aiBaseUrl: data.aiBaseUrl,
        aiApiKey: data.aiApiKey,
        aiModel: data.aiModel,
        aiTemperature: parseFloat(data.aiTemperature) || 0.75,
        systemPrompt: data.systemPrompt,
        agentName: data.agentName || "Gabriel Siqueira",
        agentAvatar: data.agentAvatar || "",
        productName: data.productName,
        productPrice: parseFloat(data.productPrice) || 97.0,
        productDeliveryLink: data.productDeliveryLink,
        paymentGateway: data.paymentGateway || "simulated",
        paymentGatewayToken: data.paymentGatewayToken || "",
        paymentWebhookSecret: data.paymentWebhookSecret || "",
        mediaCatalog: typeof data.mediaCatalog === "string" ? data.mediaCatalog : JSON.stringify(data.mediaCatalog || []),
        mediaInstructions: data.mediaInstructions ?? "",
        maxAgentPhotos: typeof data.maxAgentPhotos !== "undefined" ? parseInt(data.maxAgentPhotos) || 0 : 3,
        postPurchaseMinutes: typeof data.postPurchaseMinutes !== "undefined" ? parseInt(data.postPurchaseMinutes) || 10 : 10,
        nonPurchaseMinutes: typeof data.nonPurchaseMinutes !== "undefined" ? parseInt(data.nonPurchaseMinutes) || 15 : 15,
        cooldownHours: typeof data.cooldownHours !== "undefined" ? parseInt(data.cooldownHours) || 24 : 24,
      },
    });

    return NextResponse.json({
      success: true,
      config: {
        ...updated,
        productPrice: Number(updated.productPrice),
      },
    });
  } catch (error) {
    console.error("Error updating config:", error);
    const message = error instanceof Error ? error.message : "Erro ao salvar configurações";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
