import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabaseSchema } from "@/lib/prisma";
import { generateAIResponse } from "@/lib/ai";
import { getAppConfig } from "@/lib/config";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug") || searchParams.get("attendant");
    const cfg = await getAppConfig(slug || undefined);
    return NextResponse.json({
      success: true,
      agentName: cfg.agentName || "Gabriel Siqueira",
      agentAvatar: cfg.agentAvatar || "",
      bio: cfg.bio || "Especialista em Vendas e Atendimento",
      slug: cfg.slug || "gabriel",
      productName: cfg.productName,
      productPrice: cfg.productPrice,
    });
  } catch {
    return NextResponse.json({
      success: true,
      agentName: "Gabriel Siqueira",
      agentAvatar: "",
      slug: "gabriel",
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const { deviceId, userName, attendantSlug } = body;

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
    }

    // Resolve attendant config
    const attendant = await getAppConfig(attendantSlug || undefined);

    // Extract real IP from proxy / Cloudflare headers
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const userAgent = req.headers.get("user-agent") || "unknown";

    // Check if session exists for this device and attendant
    let session = await prisma.chatSession.findFirst({
      where: {
        deviceId,
        OR: [
          { attendantSlug: attendant.slug },
          { attendantId: attendant.id },
          ...(attendant.slug === "gabriel" ? [{ attendantSlug: null }] : []),
        ],
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

    let isReturning = false;

    if (session) {
      isReturning = true;
      // Update IP, userAgent and bind attendant
      session = await prisma.chatSession.update({
        where: { id: session.id },
        data: {
          lastIp: ip,
          userAgent,
          attendantId: attendant.id,
          attendantSlug: attendant.slug,
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
      // 1. Create brand new session bound to this attendant
      const cleanName = userName?.trim() || "Visitante";
      const createdSession = await prisma.chatSession.create({
        data: {
          deviceId,
          attendantId: attendant.id,
          attendantSlug: attendant.slug,
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
        attendantId: attendant.id,
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

    const isLocked = Boolean(session.lockedUntil && new Date(session.lockedUntil) > new Date());

    return NextResponse.json({
      success: true,
      agentName: attendant.agentName,
      agentAvatar: attendant.agentAvatar,
      isOnline: !isLocked,
      lockedUntil: session.lockedUntil,
      attendantSlug: attendant.slug,
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
