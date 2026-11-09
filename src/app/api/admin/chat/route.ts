import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabaseSchema } from "@/lib/prisma";
import { getAppConfig } from "@/lib/config";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";
const COOKIE_NAME = "admin_auth_token";

function isAuthorized(req: NextRequest): boolean {
  const cookie = req.cookies.get(COOKIE_NAME);
  const expected = "authenticated_" + Buffer.from(ADMIN_PASSWORD).toString("base64");
  return cookie?.value === expected;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const { messages, attendantId } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Nenhuma mensagem enviada" }, { status: 400 });
    }

    const cfg = await getAppConfig(attendantId);

    // If no external AI key is set, return intelligent simulated assistant response
    if (!cfg.aiApiKey) {
      const lastMsg = messages[messages.length - 1]?.content || "";
      let mockReply = `Olá! Sou seu assistente de IA. Você enviou: "${lastMsg.slice(0, 80)}". Para ativar o processamento em tempo real com LLMs (como DeepSeek, OpenAI ou Groq), preencha sua API Key na aba **Provedor de IA**. Enquanto isso, estou pronto para te ajudar com ideias de copy, roteiros e ajustes de prompt!`;
      
      if (lastMsg.toLowerCase().includes("ajuda") || lastMsg.toLowerCase().includes("ola") || lastMsg.toLowerCase().includes("oi")) {
        mockReply = `Olá! Estou à disposição. Você pode me pedir para:\n\n1. Escrever ou refinar o prompt da sua atendente (${cfg.agentName})\n2. Criar mensagens persuasivas para quebrar objeções de clientes\n3. Simular uma conversa real de vendas para testar os gatilhos\n4. Sugerir melhorias nas mensagens de entrega e pós-venda\n\nComo posso te ajudar agora?`;
      }

      return NextResponse.json({
        success: true,
        reply: mockReply,
        isSimulated: true,
      });
    }

    const endpoint = (cfg.aiBaseUrl || "https://api.deepseek.com").replace(/\/+$/, "") + "/chat/completions";

    const systemInstruction = `Você é um assistente de IA especialista em vendas, copywriting, atendimento humanizado e automação da plataforma WebChat.
O usuário com quem você está conversando é o Administrador da plataforma.
Informações do Atendente Atual configurado no sistema:
- Nome da Atendente: ${cfg.agentName}
- Produto: ${cfg.productName} (R$ ${cfg.productPrice.toFixed(2)})
- Bio: ${cfg.bio}
- Prompt Atual da Atendente: ${cfg.systemPrompt.slice(0, 1000)}

Ajude o administrador com o que ele pedir: criação de respostas, testes de atendimento, melhorias no prompt da atendente, sugestões de roteiro de vendas, ou qualquer dúvida e solicitação. Seja objetivo, prestativo e fale sempre em português do Brasil com formatação clara e agradável em markdown.`;

    const apiMessages = [
      { role: "system", content: systemInstruction },
      ...messages.slice(-12).map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || ""),
      })),
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.aiApiKey}`,
      },
      body: JSON.stringify({
        model: cfg.aiModel || "deepseek-chat",
        messages: apiMessages,
        temperature: cfg.aiTemperature ?? 0.7,
        max_tokens: 1500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro do provedor de IA (${response.status}): ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const assistantContent = data.choices?.[0]?.message?.content || "";

    if (!assistantContent) {
      throw new Error("Resposta vazia da IA");
    }

    return NextResponse.json({
      success: true,
      reply: assistantContent,
      isSimulated: false,
    });
  } catch (error) {
    console.error("Error in POST /api/admin/chat:", error);
    const msg = error instanceof Error ? error.message : "Erro ao processar mensagem com a IA";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
