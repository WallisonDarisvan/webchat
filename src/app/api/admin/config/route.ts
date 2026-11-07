import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    const config = await getAppConfig();
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
    const data = await req.json();

    const updated = await prisma.appConfig.upsert({
      where: { id: "global" },
      update: {
        aiBaseUrl: data.aiBaseUrl,
        aiApiKey: data.aiApiKey,
        aiModel: data.aiModel,
        aiTemperature: parseFloat(data.aiTemperature) || 0.75,
        systemPrompt: data.systemPrompt,
        productName: data.productName,
        productPrice: parseFloat(data.productPrice) || 97.0,
        productDeliveryLink: data.productDeliveryLink,
        paymentGateway: data.paymentGateway || "simulated",
        paymentGatewayToken: data.paymentGatewayToken || "",
        paymentWebhookSecret: data.paymentWebhookSecret || "",
      },
      create: {
        id: "global",
        aiBaseUrl: data.aiBaseUrl,
        aiApiKey: data.aiApiKey,
        aiModel: data.aiModel,
        aiTemperature: parseFloat(data.aiTemperature) || 0.75,
        systemPrompt: data.systemPrompt,
        productName: data.productName,
        productPrice: parseFloat(data.productPrice) || 97.0,
        productDeliveryLink: data.productDeliveryLink,
        paymentGateway: data.paymentGateway || "simulated",
        paymentGatewayToken: data.paymentGatewayToken || "",
        paymentWebhookSecret: data.paymentWebhookSecret || "",
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
    return NextResponse.json({ error: "Erro ao salvar configurações" }, { status: 500 });
  }
}

