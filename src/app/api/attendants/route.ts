import { NextResponse } from "next/server";
import { prisma, ensureDatabaseSchema } from "@/lib/prisma";

export async function GET() {
  try {
    await ensureDatabaseSchema();
    const attendants = await prisma.attendant.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        avatar: true,
        bio: true,
        productName: true,
        productPrice: true,
      },
    });

    return NextResponse.json({
      success: true,
      attendants: attendants.map((a) => ({
        ...a,
        productPrice: Number(a.productPrice),
      })),
    });
  } catch (error) {
    console.error("Error in GET /api/attendants:", error);
    return NextResponse.json({ success: false, attendants: [] }, { status: 500 });
  }
}
