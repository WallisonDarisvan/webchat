import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { aiBaseUrl, aiApiKey, aiModel } = await req.json();

    if (!aiApiKey) {
      return NextResponse.json(
        { success: false, error: "A chave de API (API Key) não foi preenchida." },
        { status: 400 }
      );
    }

    const endpoint = (aiBaseUrl || "https://api.deepseek.com").replace(/\/+$/, "") + "/chat/completions";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify({
        model: aiModel || "deepseek-chat",
        messages: [
          { role: "system", content: "Responda apenas com a palavra: CONEXAO_OK" },
          { role: "user", content: "Teste de conexão" },
        ],
        max_tokens: 15,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        {
          success: false,
          error: `Erro retornado pelo provedor (${res.status}): ${errText.slice(0, 300)}`,
        },
        { status: 400 }
      );
    }

    const data = await res.json();
    const responseText = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({
      success: true,
      message: "Conexão com a IA estabelecida com sucesso!",
      reply: responseText,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        error: `Falha na requisição para o provedor: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

