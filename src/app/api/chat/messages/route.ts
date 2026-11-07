import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAIResponse, ChatHistoryItem } from "@/lib/ai";
import { calculateTypingDelay, sleep } from "@/lib/humanizer";
import { createOrderForSession } from "@/lib/payment";
import { sessionEvents } from "@/lib/events";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
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
    const { sessionId, content } = body;

    if (!sessionId || !content?.trim()) {
      return NextResponse.json(
        { error: "sessionId and content are required" },
        { status: 400 }
      );
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // 1. Save User Message
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        sender: "user",
        content: content.trim(),
      },
    });

    // Broadcast user message and typing status
    sessionEvents.broadcast(sessionId, "new_message", userMessage);
    sessionEvents.broadcast(sessionId, "typing_status", { isTyping: true });

    // 2. Prepare conversation history for AI
    const history: ChatHistoryItem[] = session.messages.map((m) => ({
      sender: m.sender as "user" | "agent" | "system",
      content: m.content,
    }));

    // 3. Generate AI Response
    const aiResult = await generateAIResponse({
      userName: session.userName,
      history,
      userMessage: content.trim(),
    });

    // 4. Multi-Bubble Humanized Delivery
    const createdAgentMessages = [];

    for (let i = 0; i < aiResult.bubbles.length; i++) {
      const bubbleText = aiResult.bubbles[i];

      // Simulated human typing delay: base (2s - 3.5s) + chars * 35ms
      const delay = calculateTypingDelay(bubbleText, {
        minBase: i === 0 ? 1800 : 1200,
        maxBase: i === 0 ? 3000 : 2000,
      });

      await sleep(delay);

      const agentMsg = await prisma.chatMessage.create({
        data: {
          sessionId,
          sender: "agent",
          content: bubbleText,
          metadata: {
            bubbleIndex: i,
            totalBubbles: aiResult.bubbles.length,
          },
        },
      });

      createdAgentMessages.push(agentMsg);
      sessionEvents.broadcast(sessionId, "new_message", agentMsg);
    }

    // 5. If [GERAR_PAGAMENTO] was triggered, create payment card
    let paymentOrder = null;
    let paymentMessage = null;

    if (aiResult.shouldGeneratePayment) {
      // Brief pause between message and payment card generation (1.5s)
      await sleep(1500);

      const orderResult = await createOrderForSession({
        sessionId,
      });

      paymentOrder = orderResult;

      paymentMessage = await prisma.chatMessage.create({
        data: {
          sessionId,
          sender: "system",
          content: "Cobrança PIX gerada com sucesso",
          metadata: {
            type: "payment_card",
            orderId: orderResult.orderId,
            amount: orderResult.amount,
            pixCode: orderResult.pixCode,
            pixQrCodeUrl: orderResult.pixQrCodeUrl,
            status: orderResult.status,
          },
        },
      });

      sessionEvents.broadcast(sessionId, "new_message", paymentMessage);
    }

    // Stop typing indicator
    sessionEvents.broadcast(sessionId, "typing_status", { isTyping: false });

    return NextResponse.json({
      success: true,
      userMessage,
      agentMessages: createdAgentMessages,
      paymentMessage,
      paymentOrder,
    });
  } catch (error) {
    console.error("Error in POST /api/chat/messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

