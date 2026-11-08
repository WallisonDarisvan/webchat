import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabaseSchema } from "@/lib/prisma";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";
const COOKIE_NAME = "admin_auth_token";

function isAuthorized(req: NextRequest): boolean {
  const cookie = req.cookies.get(COOKIE_NAME);
  const expected = "authenticated_" + Buffer.from(ADMIN_PASSWORD).toString("base64");
  return cookie?.value === expected;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    await ensureDatabaseSchema();
    const { id } = await params;
    const attendant = await prisma.attendant.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!attendant) {
      return NextResponse.json({ error: "Atendente não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, attendant });
  } catch (error) {
    console.error("Error in GET /api/admin/attendants/[id]:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    await ensureDatabaseSchema();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.attendant.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Atendente não encontrado" }, { status: 404 });
    }

    // If slug is changing, verify it is not already taken
    if (body.slug && body.slug !== existing.slug) {
      const slugTaken = await prisma.attendant.findFirst({
        where: {
          slug: body.slug,
          NOT: { id: existing.id },
        },
      });
      if (slugTaken) {
        return NextResponse.json({ error: "Este slug de link já está em uso por outro atendente" }, { status: 400 });
      }
    }

    const updated = await prisma.attendant.update({
      where: { id: existing.id },
      data: {
        name: body.agentName || body.name || existing.name,
        slug: body.slug || existing.slug,
        avatar: typeof body.agentAvatar !== "undefined" ? body.agentAvatar : body.avatar ?? existing.avatar,
        bio: body.bio ?? existing.bio,
        isActive: typeof body.isActive !== "undefined" ? Boolean(body.isActive) : existing.isActive,
        aiBaseUrl: body.aiBaseUrl ?? existing.aiBaseUrl,
        aiApiKey: body.aiApiKey ?? existing.aiApiKey,
        aiModel: body.aiModel ?? existing.aiModel,
        aiTemperature: typeof body.aiTemperature !== "undefined" ? parseFloat(body.aiTemperature) : existing.aiTemperature,
        systemPrompt: body.systemPrompt ?? existing.systemPrompt,
        productName: body.productName ?? existing.productName,
        productPrice: typeof body.productPrice !== "undefined" ? parseFloat(body.productPrice) : existing.productPrice,
        productDeliveryLink: body.productDeliveryLink ?? existing.productDeliveryLink,
        paymentGateway: body.paymentGateway ?? existing.paymentGateway,
        paymentGatewayToken: body.paymentGatewayToken ?? existing.paymentGatewayToken,
        paymentWebhookSecret: body.paymentWebhookSecret ?? existing.paymentWebhookSecret,
        mediaCatalog: typeof body.mediaCatalog === "string" ? body.mediaCatalog : JSON.stringify(body.mediaCatalog || []),
        mediaInstructions: body.mediaInstructions ?? existing.mediaInstructions,
        maxAgentPhotos: typeof body.maxAgentPhotos !== "undefined" ? parseInt(body.maxAgentPhotos) : existing.maxAgentPhotos,
        postPurchaseMinutes: typeof body.postPurchaseMinutes !== "undefined" ? parseInt(body.postPurchaseMinutes) : existing.postPurchaseMinutes,
        nonPurchaseMinutes: typeof body.nonPurchaseMinutes !== "undefined" ? parseInt(body.nonPurchaseMinutes) : existing.nonPurchaseMinutes,
        cooldownHours: typeof body.cooldownHours !== "undefined" ? parseInt(body.cooldownHours) : existing.cooldownHours,
      },
    });

    return NextResponse.json({ success: true, attendant: updated });
  } catch (error) {
    console.error("Error updating attendant:", error);
    const msg = error instanceof Error ? error.message : "Erro ao atualizar atendente";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    await ensureDatabaseSchema();
    const { id } = await params;

    const total = await prisma.attendant.count();
    if (total <= 1) {
      return NextResponse.json(
        { error: "Não é permitido excluir o único atendente do sistema." },
        { status: 400 }
      );
    }

    const existing = await prisma.attendant.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Atendente não encontrado" }, { status: 404 });
    }

    await prisma.attendant.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, message: "Atendente excluído com sucesso" });
  } catch (error) {
    console.error("Error deleting attendant:", error);
    const msg = error instanceof Error ? error.message : "Erro ao excluir atendente";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

