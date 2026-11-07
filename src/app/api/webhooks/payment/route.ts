import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markOrderAsPaid } from "@/lib/payment";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: Record<string, unknown> = {};

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    console.log("Payment Webhook received:", JSON.stringify(body, null, 2));

    let targetOrderId: string | null = null;
    let isApproved = false;

    // 1. Direct simulation or generic test payload:
    // { orderId: "...", status: "paid" }
    if (typeof body.orderId === "string") {
      targetOrderId = body.orderId;
      if (body.status === "paid" || body.status === "approved" || !body.status) {
        isApproved = true;
      }
    }

    // 2. Asaas Webhook format:
    // { event: "PAYMENT_CONFIRMED" | "PAYMENT_RECEIVED", payment: { externalReference: "..." } }
    if (body.event === "PAYMENT_CONFIRMED" || body.event === "PAYMENT_RECEIVED") {
      const paymentObj = body.payment as { externalReference?: string; id?: string } | undefined;
      if (paymentObj?.externalReference) {
        targetOrderId = paymentObj.externalReference;
      }
      isApproved = true;
    }

    // 3. Mercado Pago format:
    // { action: "payment.updated", data: { id: "..." } } or with external_reference
    if (body.type === "payment" || body.action?.toString().includes("payment")) {
      const dataObj = body.data as { id?: string; external_reference?: string; status?: string } | undefined;
      if (dataObj?.external_reference) {
        targetOrderId = dataObj.external_reference;
      }
      if (dataObj?.status === "approved" || body.status === "approved") {
        isApproved = true;
      }
    }

    // 4. Check if externalId matches an order
    if (!targetOrderId && typeof body.id === "string") {
      const orderByExternal = await prisma.order.findFirst({
        where: {
          OR: [{ id: body.id }, { externalId: body.id }],
        },
      });
      if (orderByExternal) {
        targetOrderId = orderByExternal.id;
        isApproved = true;
      }
    }

    if (!targetOrderId) {
      return NextResponse.json(
        { message: "Webhook acknowledged, no matching order found", payload: body },
        { status: 200 }
      );
    }

    if (isApproved) {
      const result = await markOrderAsPaid(targetOrderId);
      return NextResponse.json({
        success: true,
        orderId: targetOrderId,
        status: "paid",
        result,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed, payment not yet approved",
      orderId: targetOrderId,
    });
  } catch (error) {
    console.error("Error processing payment webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

