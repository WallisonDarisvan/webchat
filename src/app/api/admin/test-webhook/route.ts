import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markOrderAsPaid } from "@/lib/payment";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    let targetOrderId = orderId;

    if (!targetOrderId) {
      // Find the latest pending order
      const latestOrder = await prisma.order.findFirst({
        where: { status: "pending" },
        orderBy: { createdAt: "desc" },
      });

      if (!latestOrder) {
        return NextResponse.json(
          {
            success: false,
            error: "Nenhum pedido pendente encontrado para simular pagamento.",
          },
          { status: 404 }
        );
      }
      targetOrderId = latestOrder.id;
    }

    const result = await markOrderAsPaid(targetOrderId);

    return NextResponse.json({
      success: true,
      message: `Simulação de webhook executada para o pedido: ${targetOrderId}`,
      result,
    });
  } catch (error) {
    console.error("Error in test-webhook:", error);
    return NextResponse.json({ error: "Erro ao simular webhook" }, { status: 500 });
  }
}

