import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabaseSchema } from "@/lib/prisma";

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
    await ensureDatabaseSchema();
    const { searchParams } = new URL(req.url);
    const attendantId = searchParams.get("attendantId") || searchParams.get("slug") || undefined;

    const sessionWhere = attendantId
      ? {
          OR: [{ attendantId }, { attendantSlug: attendantId }],
        }
      : {};

    const orderWhere = attendantId
      ? {
          OR: [{ attendantId }, { attendantSlug: attendantId }],
        }
      : {};

    const [totalSessions, totalMessages, orders, recentSessions] = await Promise.all([
      prisma.chatSession.count({ where: sessionWhere }),
      prisma.chatMessage.count({
        where: attendantId
          ? {
              session: sessionWhere,
            }
          : {},
      }),
      prisma.order.findMany({
        where: orderWhere,
        orderBy: { createdAt: "desc" },
        take: 30,
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
      prisma.chatSession.findMany({
        where: sessionWhere,
        orderBy: { updatedAt: "desc" },
        take: 15,
        include: {
          _count: {
            select: { messages: true },
          },
          orders: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      }),
    ]);

    const paidOrders = orders.filter((o) => o.status === "paid");
    const totalRevenue = paidOrders.reduce((acc, curr) => acc + Number(curr.amount), 0);

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
