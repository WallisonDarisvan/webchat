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

    // Query show flags safely
    const flagsMap: Record<string, { showBio: boolean; showProductName: boolean; showProductPrice: boolean }> = {};
    try {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `SELECT id, show_bio, show_product_name, show_product_price FROM attendants WHERE is_active = 1`
      );
      if (Array.isArray(rows)) {
        for (const r of rows) {
          flagsMap[r.id] = {
            showBio: typeof r.show_bio !== "undefined" && r.show_bio !== null ? Boolean(r.show_bio) : true,
            showProductName: typeof r.show_product_name !== "undefined" && r.show_product_name !== null ? Boolean(r.show_product_name) : true,
            showProductPrice: typeof r.show_product_price !== "undefined" && r.show_product_price !== null ? Boolean(r.show_product_price) : true,
          };
        }
      }
    } catch {}

    return NextResponse.json({
      success: true,
      attendants: attendants.map((a) => ({
        ...a,
        productPrice: Number(a.productPrice),
        showBio: flagsMap[a.id]?.showBio ?? true,
        showProductName: flagsMap[a.id]?.showProductName ?? true,
        showProductPrice: flagsMap[a.id]?.showProductPrice ?? true,
      })),
    });
  } catch (error) {
    console.error("Error in GET /api/attendants:", error);
    return NextResponse.json({ success: false, attendants: [] }, { status: 500 });
  }
}

