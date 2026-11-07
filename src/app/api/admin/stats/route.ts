import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";
const COOKIE_NAME = "admin_auth_token";

function isAuthorized(req: NextRequest): boolean {
  const cookie = req.cookies.get(COOKIE_NAME);
  const expected = "authenticated_" + Buffer.from(ADMIN_PASSWORD).toString("base64");
  return cookie?.value === expected;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const [totalSessions, totalMessages, orders] = await Promise.all([
      prisma.chatSession.count(),
      prisma.chatMessage.count(),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          session: {
            select: {
              userName: true,
              deviceId: true,
              lastIp: true,
            },
          },
        },
      }),
    ]);

    const paidOrders = orders.filter((o) => o.status === "paid");
    const totalRevenue = paidOrders.reduce((acc, curr) => acc + Number(curr.amount), 0);

    const recentSessions = await prisma.chatSession.findMany({
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: {
        _count: {
          select: { messages: true },
        },
        orders: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalSessions,
        totalMessages,
        totalOrders: orders.length,
        paidOrdersCount: paidOrders.length,
        totalRevenue,
      },
      recentOrders: orders.map((o) => ({
        ...o,
        amount: Number(o.amount),
      })),
      recentSessions,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/stats:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

