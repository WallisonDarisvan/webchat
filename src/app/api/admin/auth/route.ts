import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";
const COOKIE_NAME = "admin_auth_token";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, message: "Autenticado com sucesso" });

    // Set HTTP-only cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: "authenticated_" + Buffer.from(ADMIN_PASSWORD).toString("base64"),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE_NAME);
  const expected = "authenticated_" + Buffer.from(ADMIN_PASSWORD).toString("base64");

  const isAuthenticated = cookie?.value === expected;

  return NextResponse.json({ isAuthenticated });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}

