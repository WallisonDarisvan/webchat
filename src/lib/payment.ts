import QRCode from "qrcode";
import { prisma } from "./prisma";
import { getAppConfig, DEFAULT_DELIVERY_MESSAGE } from "./config";
import { sessionEvents } from "./events";

export interface CreateOrderParams {
  sessionId: string;
  amount?: number;
  productName?: string;
}

export interface OrderResult {
  orderId: string;
  amount: number;
  pixCode: string;
  pixQrCodeUrl: string;
  status: string;
}

/**
 * Generates a valid standard or demo PIX Copy-Paste code with CRC16
 */
export function generatePixCopiaECola(params: {
  key?: string;
  merchantName?: string;
  merchantCity?: string;
  amount: number;
  txId?: string;
}): string {
  const {
    key = "contato@empresa.com",
    merchantName = "LOJA OFICIAL",
    merchantCity = "SAO PAULO",
    amount,
    txId = Math.random().toString(36).substring(2, 10).toUpperCase(),
  } = params;

  const formattedAmount = amount.toFixed(2);

  // EMV format helper: ID (2 chars) + Length (2 chars) + Value
  const formatField = (id: string, value: string): string => {
    const len = value.length.toString().padStart(2, "0");
    return `${id}${len}${value}`;
  };

  // Merchant Account Info (GUI + Key)
  const gui = formatField("00", "br.gov.bcb.pix");
  const pixKey = formatField("01", key);
  const merchantAccountInfo = formatField("26", `${gui}${pixKey}`);

  // Additional Data Field (txId)
  const txIdField = formatField("05", txId);
  const additionalData = formatField("62", txIdField);

  let raw =
    formatField("00", "01") + // Payload Format Indicator
    merchantAccountInfo +
    formatField("52", "0000") + // Merchant Category Code
    formatField("53", "986") + // Transaction Currency (BRL)
    formatField("54", formattedAmount) + // Transaction Amount
    formatField("58", "BR") + // Country Code
    formatField("59", merchantName.substring(0, 25)) + // Merchant Name
    formatField("60", merchantCity.substring(0, 15)) + // Merchant City
    additionalData +
    "6304"; // CRC placeholder

  // Calculate CRC16 CCITT
  let crc = 0xffff;
  for (let i = 0; i < raw.length; i++) {
    crc ^= raw.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  const hexCrc = crc.toString(16).toUpperCase().padStart(4, "0");
  return `${raw}${hexCrc}`;
}

/**
 * Creates an order in the database and generates PIX payment details
 */
export async function createOrderForSession(params: CreateOrderParams): Promise<OrderResult> {
  const session = await prisma.chatSession.findUnique({
    where: { id: params.sessionId },
  });
  const attendantIdent = (session as any)?.attendantId || (session as any)?.attendantSlug;
  const config = await getAppConfig(attendantIdent);
  const amount = params.amount ?? config.productPrice;

  // Generate PIX code
  const pixCode = generatePixCopiaECola({
    amount,
    merchantName: config.productName.substring(0, 20).toUpperCase(),
  });

  // Generate real QR Code data URL
  const pixQrCodeUrl = await QRCode.toDataURL(pixCode, {
    margin: 2,
    width: 256,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  const order = await prisma.order.create({
    data: {
      sessionId: params.sessionId,
      attendantId: (session as any)?.attendantId || null,
      attendantSlug: (session as any)?.attendantSlug || null,
      amount,
      status: "pending",
      deliveryLink: config.productDeliveryLink,
      pixCode,
      pixQrCodeUrl,
      externalId: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
  });

  return {
    orderId: order.id,
    amount: Number(order.amount),
    pixCode,
    pixQrCodeUrl,
    status: order.status,
  };
}

/**
 * Marks order as paid, stores payment timestamp, and safely injects
 * delivery link message into the chat.
 */
export async function markOrderAsPaid(orderId: string): Promise<{ success: boolean; message?: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { session: true },
  });

  if (!order) {
    return { success: false, message: "Order not found" };
  }

  if (order.status === "paid") {
    return { success: true, message: "Order already paid" };
  }

  // Update order to paid
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "paid",
      paidAt: new Date(),
    },
  });

  // Build the congratulatory message with delivery link
  const config = await getAppConfig(order.attendantId || undefined);
  const deliveryUrl = order.deliveryLink || config.productDeliveryLink;
  const rawTemplate = config.productDeliveryMessage || DEFAULT_DELIVERY_MESSAGE;

  let deliveryMessageContent = rawTemplate
    .replace(/\[CLIENTE\]/gi, order.session.userName)
    .replace(/\[NOME_CLIENTE\]/gi, order.session.userName)
    .replace(/\[NOME\]/gi, order.session.userName)
    .replace(/\[LINK_ENTREGA\]/gi, deliveryUrl)
    .replace(/\[LINK\]/gi, deliveryUrl)
    .replace(/\[PRODUTO\]/gi, config.productName);

  // Safety fallback: if the admin omitted the link token, ensure the link is appended
  if (!deliveryMessageContent.includes(deliveryUrl)) {
    deliveryMessageContent += `\n\n👉 ${deliveryUrl}`;
  }

  const agentMessage = await prisma.chatMessage.create({
    data: {
      sessionId: order.sessionId,
      sender: "agent",
      content: deliveryMessageContent,
      metadata: {
        type: "order_confirmation",
        orderId: order.id,
        deliveryLink: deliveryUrl,
      },
    },
  });

  // Broadcast real-time SSE event to this specific session
  sessionEvents.broadcast(order.sessionId, "order_paid", {
    orderId: order.id,
    status: "paid",
    paidAt: updatedOrder.paidAt,
    message: agentMessage,
  });

  return { success: true, message: "Order marked as paid and delivery link released" };
}

