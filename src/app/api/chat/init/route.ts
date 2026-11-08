import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabaseSchema } from "@/lib/prisma";
import { generateAIResponse } from "@/lib/ai";
import { getAppConfig } from "@/lib/config";

export async function GET() {
  try {
    const cfg = await getAppConfig();
    return NextResponse.json({
      success: true,
      agentName: cfg.agentName || "Gabriel Siqueira",
      agentAvatar: cfg.agentAvatar || "",
    });
  } catch {
    return NextResponse.json({
      success: true,
      agentName: "Gabriel Siqueira",
      agentAvatar: "",
    });
  }
}

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
      // 1. Create brand new session
      const cleanName = userName?.trim() || "Visitante";
      const createdSession = await prisma.chatSession.create({
        data: {
          deviceId,
          userName: cleanName,
          lastIp: ip,
          userAgent,
        },
      });

      // 2. Generate initial greeting dynamically with the AI
      const aiGreeting = await generateAIResponse({
        userName: cleanName,
        history: [],
        userMessage: `[O visitante acabou de entrar no chat e informou que se chama "${cleanName}". Dê as boas-vindas a ele em primeira pessoa, de forma calorosa, humana e descontraída, como uma pessoa real digitando no WhatsApp, iniciando o atendimento de forma envolvente.]`,
      });

      // 3. Save AI greeting bubbles in DB
      for (let i = 0; i < aiGreeting.bubbles.length; i++) {
        await prisma.chatMessage.create({
          data: {
            sessionId: createdSession.id,
            sender: "agent",
            content: aiGreeting.bubbles[i],
            metadata: {
              bubbleIndex: i,
              totalBubbles: aiGreeting.bubbles.length,
            },
          },
        });
      }

      // 4. Fetch the complete session with newly created AI messages
      session = await prisma.chatSession.findUnique({
        where: { id: createdSession.id },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
          orders: true,
        },
      });
    }

    if (!session) {
      return NextResponse.json({ error: "Failed to initialize session" }, { status: 500 });
    }

    // Strip image URL from expired view-once photos for strict security
    const sanitizedMessages = session.messages.map((msg) => {
      if (!msg.metadata) return msg;
      try {
        const meta =
          typeof msg.metadata === "string"
            ? JSON.parse(msg.metadata)
            : { ...(msg.metadata as Record<string, any>) };
        if (meta.viewOnce && meta.viewed) {
          meta.imageUrl = null;
          return { ...msg, metadata: meta };
        }
      } catch {}
      return msg;
    });

    const cfg = await getAppConfig();
    const isLocked = Boolean(session.lockedUntil && new Date(session.lockedUntil) > new Date());

    return NextResponse.json({
      success: true,
      agentName: cfg.agentName || "Gabriel Siqueira",
      agentAvatar: cfg.agentAvatar || "",
      isOnline: !isLocked,
      lockedUntil: session.lockedUntil,
      session: {
        id: session.id,
        deviceId: session.deviceId,
        userName: session.userName,
        createdAt: session.createdAt,
      },
      messages: sanitizedMessages,
      latestOrder: session.orders[0] || null,
      isReturning,
    });
  } catch (error) {
    console.error("Error in /api/chat/init:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
