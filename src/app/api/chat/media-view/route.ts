import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionEvents } from "@/lib/events";

export async function POST(req: NextRequest) {
  try {
    const { messageId, sessionId } = await req.json();

    if (!messageId || !sessionId) {
      return NextResponse.json(
        { error: "messageId e sessionId são obrigatórios" },
        { status: 400 }
      );
    }

    const message = await prisma.chatMessage.findFirst({
      where: { id: messageId, sessionId },
    });

    if (!message) {
      return NextResponse.json({ error: "Mensagem não encontrada" }, { status: 404 });
    }

    let meta: Record<string, any> = {};
    if (message.metadata) {
      meta = typeof message.metadata === "string" ? JSON.parse(message.metadata) : message.metadata;
    }

    if (!meta.viewOnce) {
      return NextResponse.json({ success: true, imageUrl: meta.imageUrl });
    }

    // If already viewed, strictly refuse access
    if (meta.viewed) {
      return NextResponse.json(
        { error: "Esta foto de visualização única já foi aberta e expirou.", expired: true },
        { status: 403 }
      );
    }

    // Mark as viewed in database
    const updatedMeta = {
      ...meta,
      viewed: true,
      viewedAt: new Date().toISOString(),
    };

    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { metadata: updatedMeta },
    });

    // Broadcast update so all tabs/sessions reflect that it is now opened
    sessionEvents.broadcast(sessionId, "message_updated", {
      id: messageId,
      metadata: updatedMeta,
    });

    return NextResponse.json({
      success: true,
      imageUrl: meta.imageUrl,
    });
  } catch (error) {
    console.error("Error in /api/chat/media-view:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

