import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queueAIMessageGeneration } from "@/lib/ai-queue";
import { sessionEvents } from "@/lib/events";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const rawMessages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    // Strip image URL from expired view-once photos for strict security
    const messages = rawMessages.map((msg) => {
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

    const orders = await prisma.order.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      take: 1,
    });

    return NextResponse.json({
      success: true,
      messages,
      latestOrder: orders[0] || null,
    });
  } catch (error) {
    console.error("Error in GET /api/chat/messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, content, image } = body;

    if (!sessionId || (!content?.trim() && !image)) {
      return NextResponse.json(
        { error: "sessionId and message content/image are required" },
        { status: 400 }
      );
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Enforce max 10 photos per chat session
    if (image) {
      const userMessages = await prisma.chatMessage.findMany({
        where: {
          sessionId,
          sender: "user",
        },
        select: { metadata: true },
      });

      const photoCount = userMessages.filter((m) => {
        if (!m.metadata) return false;
        try {
          const meta = typeof m.metadata === "string" ? JSON.parse(m.metadata as string) : m.metadata;
          return !!(meta as { imageUrl?: string })?.imageUrl;
        } catch {
          return false;
        }
      }).length;

      if (photoCount >= 10) {
        return NextResponse.json(
          { error: "Limite de 10 fotos por atendimento atingido.", limitReached: true },
          { status: 400 }
        );
      }
    }

    // 1. Immediately save User Message to DB (including optimized image if present)
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        sender: "user",
        content: (content || "").trim(),
        metadata: image ? { imageUrl: image } : undefined,
      },
    });

    // 2. Broadcast user message to SSE listeners
    sessionEvents.broadcast(sessionId, "new_message", userMessage);

    // 3. Check if session is currently locked (cooldown / offline)
    const isLocked = Boolean(session.lockedUntil && new Date(session.lockedUntil) > new Date());
    if (isLocked) {
      // The attendant is offline. Do not queue AI response (silence/offline)
      return NextResponse.json({
        success: true,
        userMessage,
        isOffline: true,
      });
    }

    // 4. Queue AI response with debouncing so the user can send multiple messages
    // The AI will wait ~2.2s of user inactivity and read all consecutive messages together!
    queueAIMessageGeneration(sessionId, 2200);

    return NextResponse.json({
      success: true,
      userMessage,
    });
  } catch (error) {
    console.error("Error in POST /api/chat/messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
