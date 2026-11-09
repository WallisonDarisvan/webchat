import { prisma } from "./prisma";
import { generateAIResponse, ChatHistoryItem } from "./ai";
import { calculateTypingDelay, sleep } from "./humanizer";
import { createOrderForSession } from "./payment";
import { sessionEvents } from "./events";
import { getAppConfig, MediaItem } from "./config";

interface SessionQueueState {
  timeoutId: NodeJS.Timeout | null;
  isProcessing: boolean;
  hasPendingSubsequent: boolean;
}

const sessionQueues = new Map<string, SessionQueueState>();

/**
 * Queues AI response generation with intelligent debouncing.
 * Allows the user to send multiple messages in sequence (e.g. on WhatsApp).
 * The AI waits until the user pauses typing to read the entire set of messages together.
 */
export function queueAIMessageGeneration(sessionId: string, debounceMs: number = 2200) {
  let state = sessionQueues.get(sessionId);
  if (!state) {
    state = { timeoutId: null, isProcessing: false, hasPendingSubsequent: false };
    sessionQueues.set(sessionId, state);
  }

  // User sent another message: reset debounce timer
  if (state.timeoutId) {
    clearTimeout(state.timeoutId);
    state.timeoutId = null;
  }

  // If currently outputting a response, flag subsequent messages to be processed right after
  if (state.isProcessing) {
    state.hasPendingSubsequent = true;
    return;
  }

  state.timeoutId = setTimeout(async () => {
    state!.timeoutId = null;
    await processSessionAI(sessionId);
  }, debounceMs);
}

async function processSessionAI(sessionId: string) {
  const state = sessionQueues.get(sessionId);
  if (!state) return;

  state.isProcessing = true;
  state.hasPendingSubsequent = false;

  try {
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        orders: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!session || session.messages.length === 0) return;

    // Strict guard: AI should ONLY process and respond if the latest message in the session is from the user!
    // If the latest message was already from agent or system, all user messages are already answered.
    const latestMessage = session.messages[session.messages.length - 1];
    if (latestMessage.sender !== "user") {
      return;
    }

    const attendantIdent = (session as any).attendantId || (session as any).attendantSlug;
    const cfg = await getAppConfig(attendantIdent);
    const paidOrder = session.orders.find((o) => o.status === "paid");
    const pendingOrder = session.orders.find((o) => o.status === "pending");
    const cancelledOrder = session.orders.find((o) => o.status === "cancelled" || o.status === "refunded");
    const now = new Date();
    let systemDirective: string | undefined = undefined;
    let shouldLockAfterResponse = false;
    let lockReason: string | undefined = undefined;

    // Find the latest user message and image first
    const lastUserMessageObj = [...session.messages].reverse().find((m) => m.sender === "user");
    const lastUserMessage = lastUserMessageObj ? lastUserMessageObj.content : "";
    let lastUserImageUrl: string | undefined = undefined;
    if (lastUserMessageObj?.metadata) {
      if (typeof lastUserMessageObj.metadata === "object") {
        lastUserImageUrl = (lastUserMessageObj.metadata as any)?.imageUrl;
      } else if (typeof lastUserMessageObj.metadata === "string") {
        try {
          const parsed = JSON.parse(lastUserMessageObj.metadata);
          lastUserImageUrl = parsed?.imageUrl;
        } catch {}
      }
    }

    const lowerUserMsg = lastUserMessage.toLowerCase();
    const rejectionPattern = /(não\s+quero|nao\s+quero|não\s+vou\s+pagar|nao\s+vou\s+pagar|tá\s+caro|ta\s+caro|muito\s+caro|deixa\s+pra\s+l[aá]|não\s+tenho\s+dinheiro|nao\s+tenho\s+dinheiro|nem\s+pensar|não\s+vou\s+comprar|nao\s+vou\s+comprar|valeu\s+mas\s+não|valeu\s+mas\s+nao)/i;
    const isCustomerRejection = rejectionPattern.test(lowerUserMsg);

    // Determine client status in database for dynamic tag injection
    let clientStatusTag: string | undefined = undefined;
    if (paidOrder) {
      clientStatusTag = "[STATUS_CLIENTE: VENDA_CONCLUIDA]";
    } else if (
      cancelledOrder ||
      session.lockReason === "customer_rejected" ||
      session.lockReason === "pix_timeout_ended" ||
      isCustomerRejection
    ) {
      clientStatusTag = "[STATUS_CLIENTE: VENDA_DESISTIU]";
    } else if (pendingOrder) {
      clientStatusTag = "[STATUS_CLIENTE: VENDA_PENDENTE]";
    }

    // Check if session was previously locked, but 24h passed and user just sent a message (return scenario)
    const wasLocked = Boolean(session.lockedUntil && new Date(session.lockedUntil) <= now);
    if (wasLocked && !session.returnHandled) {
      if (paidOrder) {
        systemDirective = "O cliente voltou após a compra. Cumprimente-o como se fosse o dia seguinte, pergunte se ele gostou das fotinhas e continue o flerte casual.";
      } else {
        systemDirective = "O cliente voltou no outro dia sem ter comprado. Retome o flerte, provoque ele e tente fechar a venda das fotinhas completas novamente com [GERAR_PAGAMENTO].";
      }
      // Clear the expired lock and record return handled
      await prisma.chatSession.update({
        where: { id: session.id },
        data: {
          lockedUntil: null,
          returnHandled: true,
        },
      });
    }

    // If not returning from a 24h lock, evaluate the 3 specific exit triggers:
    if (!systemDirective) {
      if (paidOrder) {
        // Cenário 1: Cliente COMPROU - conversa por 10 minutos (postPurchaseMinutes) pós-PIX
        const paidAt = paidOrder.paidAt || paidOrder.updatedAt;
        const minutesSincePayment = (now.getTime() - new Date(paidAt).getTime()) / (1000 * 60);
        const maxPostPurchase = cfg.postPurchaseMinutes || 10;
        if (minutesSincePayment >= maxPostPurchase) {
          systemDirective = `O tempo de conversa pós-venda acabou (passaram-se mais de ${Math.round(minutesSincePayment)} minutos desde o pagamento). Use a desculpa do namorado que acabou de chegar para encerrar a conversa agora, diga que volta amanhã e adicione a tag [ENCERRAR_CONVERSA].`;
          shouldLockAfterResponse = true;
          lockReason = "post_purchase_ended";
        }
      } else {
        // Cenário 2: Cliente NÃO COMPROU - a conversa flui ativamente, EXCETO sob 3 gatilhos:

        // GATILHO 3: O cliente está demorando para fechar após o envio do PIX (>= 5 min esperando PIX pendente)
        if (pendingOrder) {
          const minutesSincePix = (now.getTime() - new Date(pendingOrder.createdAt).getTime()) / (1000 * 60);
          if (minutesSincePix >= 5) {
            systemDirective = `A cobrança PIX foi gerada há mais de ${Math.round(minutesSincePix)} minutos e o cliente ainda não pagou. Use a desculpa do namorado que acabou de chegar para encerrar a conversa agora, avise que volta amanhã e adicione a tag [ENCERRAR_CONVERSA].`;
            shouldLockAfterResponse = true;
            lockReason = "pix_timeout_ended";
          }
        }

        // GATILHO 1: O cliente não falou durante um tempo (inatividade prolongada entre as mensagens)
        if (!systemDirective) {
          const userMessages = session.messages.filter((m) => m.sender === "user");
          if (userMessages.length >= 2) {
            const currentMsg = userMessages[userMessages.length - 1];
            const prevMsg = userMessages[userMessages.length - 2];
            const silenceMinutes = (new Date(currentMsg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) / (1000 * 60);
            const maxInactivity = cfg.nonPurchaseMinutes || 15;
            if (silenceMinutes >= maxInactivity) {
              systemDirective = `O cliente ficou sem falar durante ${Math.round(silenceMinutes)} minutos e voltou só agora. Como ele demorou muito para responder, use a desculpa do namorado que acabou de chegar para encerrar a conversa agora, avise que volta amanhã e adicione a tag [ENCERRAR_CONVERSA].`;
              shouldLockAfterResponse = true;
              lockReason = "abandoned_inactivity";
            }
          }
        }

        // GATILHO 2: O cliente não quer (recusa explícita de compra)
        if (!systemDirective) {
          const lowerUserMsg = lastUserMessage.toLowerCase();
          const rejectionPattern = /(não\s+quero|nao\s+quero|não\s+vou\s+pagar|nao\s+vou\s+pagar|tá\s+caro|ta\s+caro|muito\s+caro|deixa\s+pra\s+l[aá]|não\s+tenho\s+dinheiro|nao\s+tenho\s+dinheiro|nem\s+pensar|não\s+vou\s+comprar|nao\s+vou\s+comprar|valeu\s+mas\s+não|valeu\s+mas\s+nao)/i;
          if (rejectionPattern.test(lowerUserMsg)) {
            systemDirective = "O cliente acabou de recusar a compra e disse que não quer comprar. Use a desculpa do namorado para encerrar a conversa de forma descontraída, diga que vocês conversam amanhã e adicione a tag [ENCERRAR_CONVERSA].";
            shouldLockAfterResponse = true;
            lockReason = "customer_rejected";
          }
        }
      }
    }

    // Signal frontend that attendant started typing
    sessionEvents.broadcast(sessionId, "typing_status", { isTyping: true });

    // Prepare full conversation history with multimodal images
    const history: ChatHistoryItem[] = session.messages.map((m) => {
      let imageUrl: string | undefined = undefined;
      if (m.metadata) {
        if (typeof m.metadata === "object" && (m.metadata as any)?.imageUrl) {
          imageUrl = (m.metadata as any).imageUrl;
        } else if (typeof m.metadata === "string") {
          try {
            const parsed = JSON.parse(m.metadata);
            if (parsed?.imageUrl) imageUrl = parsed.imageUrl;
          } catch {}
        }
      }

      return {
        sender: m.sender as "user" | "agent" | "system",
        content: m.content,
        imageUrl,
      };
    });

    // Generate AI response considering the entire grouped context and multimodal images
    const aiResult = await generateAIResponse({
      userName: session.userName,
      history,
      userMessage: lastUserMessage,
      imageUrl: lastUserImageUrl,
      systemDirective,
      attendantId: attendantIdent,
      clientStatus: clientStatusTag,
    });

    // Deliver multi-bubbles with human typing pace
    for (let i = 0; i < aiResult.bubbles.length; i++) {
      const bubbleText = aiResult.bubbles[i];

      const delay = calculateTypingDelay(bubbleText, {
        minBase: i === 0 ? 1500 : 1000,
        maxBase: i === 0 ? 2500 : 1800,
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

      sessionEvents.broadcast(sessionId, "new_message", agentMsg);
    }

    // If media trigger tag [ENVIAR_MIDIA:id] was detected, send the media photo
    if (aiResult.mediaIdToSend) {
      try {
        const attendantIdent = (session as any).attendantId || (session as any).attendantSlug;
    const cfg = await getAppConfig(attendantIdent);
        const maxAllowed = typeof cfg.maxAgentPhotos === "number" ? cfg.maxAgentPhotos : 3;

        // Hard backend check: count how many media photos agent has already sent in this session
        const agentMessages = await prisma.chatMessage.findMany({
          where: { sessionId, sender: "agent" },
          select: { metadata: true },
        });

        const agentMediaSentCount = agentMessages.filter((m) => {
          if (!m.metadata) return false;
          try {
            const meta = typeof m.metadata === "string" ? JSON.parse(m.metadata as string) : m.metadata;
            return (meta as { type?: string; imageUrl?: string })?.type === "agent_media" || Boolean((meta as { imageUrl?: string })?.imageUrl);
          } catch {
            return false;
          }
        }).length;

        if (agentMediaSentCount >= maxAllowed) {
          console.warn(
            `[Security] Blocked AI media send. Session ${sessionId} already reached maxAgentPhotos limit (${agentMediaSentCount}/${maxAllowed}).`
          );
        } else {
          const catalog: MediaItem[] = JSON.parse(cfg.mediaCatalog || "[]");
          const matched = catalog.find((m) => m.id.toLowerCase() === aiResult.mediaIdToSend?.toLowerCase());

          if (matched) {
            await sleep(1200);

            const mediaMsg = await prisma.chatMessage.create({
              data: {
                sessionId,
                sender: "agent",
                content: "", // Apenas a foto limpa, sem título nem texto
                metadata: {
                  type: "agent_media",
                  imageUrl: matched.url,
                  title: matched.title,
                  mediaId: matched.id,
                  viewOnce: Boolean(matched.viewOnce),
                  viewed: false,
                },
              },
            });

            sessionEvents.broadcast(sessionId, "new_message", mediaMsg);
          }
        }
      } catch (err) {
        console.error("Error sending triggered media:", err);
      }
    }

    // If purchase intent was detected, emit payment card
    if (aiResult.shouldGeneratePayment) {
      await sleep(1500);

      const orderResult = await createOrderForSession({ sessionId });

      const paymentMessage = await prisma.chatMessage.create({
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

    // If exit trigger was executed (either flagged by director OR emitted by AI with [ENCERRAR_CONVERSA])
    if (shouldLockAfterResponse || aiResult.shouldEndConversation) {
      const cooldownHours = cfg.cooldownHours || 24;
      const lockedUntil = new Date(Date.now() + cooldownHours * 60 * 60 * 1000);
      const finalReason = lockReason || "ended_by_agent";
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          lockedUntil,
          lockReason: finalReason,
          returnHandled: false,
        },
      });

      sessionEvents.broadcast(sessionId, "agent_status", {
        isOnline: false,
        lockedUntil,
        reason: finalReason,
      });
    }
  } catch (err) {
    console.error("Error in processSessionAI queue:", err);
  } finally {
    sessionEvents.broadcast(sessionId, "typing_status", { isTyping: false });
    state.isProcessing = false;

    // If new user messages arrived while agent was typing, process them!
    if (state.hasPendingSubsequent) {
      state.hasPendingSubsequent = false;
      queueAIMessageGeneration(sessionId, 1200);
    }
  }
}

