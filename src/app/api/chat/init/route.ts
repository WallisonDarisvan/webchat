import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabaseSchema } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const { deviceId, userName } = body;

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
    }

    // Extract real IP from proxy / Cloudflare headers
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const userAgent = req.headers.get("user-agent") || "unknown";

    // Check if session exists
    let session = await prisma.chatSession.findUnique({
      where: { deviceId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    let isReturning = false;

    if (session) {
      isReturning = true;
      // Update IP and userAgent
      session = await prisma.chatSession.update({
        where: { id: session.id },
        data: {
          lastIp: ip,
          userAgent,
          ...(userName ? { userName } : {}),
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
          orders: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });
    } else {
      // Create new session
      const cleanName = userName?.trim() || "Visitante";
      session = await prisma.chatSession.create({
        data: {
          deviceId,
          userName: cleanName,
          lastIp: ip,
          userAgent,
          messages: {
            create: {
              sender: "agent",
              content: `Olá, ${cleanName}! Tudo bem? Sou o atendente aqui da equipe. Como posso te ajudar hoje?`,
            },
          },
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
          orders: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        deviceId: session.deviceId,
        userName: session.userName,
        createdAt: session.createdAt,
      },
      messages: session.messages,
      latestOrder: session.orders[0] || null,
      isReturning,
    });
  } catch (error) {
    console.error("Error in /api/chat/init:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

