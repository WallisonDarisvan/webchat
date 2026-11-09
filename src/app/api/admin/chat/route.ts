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
      const lastMsg = messages[messages.length - 1];
      const lastContent = lastMsg?.content || "";
      const hasImage = Boolean(lastMsg?.imageUrl);

      let mockReply = `Olá! Sou seu assistente de IA. Você enviou: "${lastContent.slice(0, 80)}". Para ativar o processamento em tempo real com LLMs e visão computacional (como DeepSeek, OpenAI ou Gemini), preencha sua API Key na aba **Provedor de IA**.`;
      
      if (hasImage) {
        mockReply = `Recebi sua imagem com sucesso! No modo de teste local sem chave de API externa, a leitura multimodal de imagem fica simulada. Para analisar e ler imagens reais (prints, designs, comprovantes ou produtos), insira uma chave de API com suporte a visão na aba **Provedor de IA**.`;
      } else if (lastContent.toLowerCase().includes("ajuda") || lastContent.toLowerCase().includes("ola") || lastContent.toLowerCase().includes("oi")) {
        mockReply = `Olá! Estou à disposição. Você pode me pedir para:\n\n1. Escrever ou refinar o prompt da sua atendente (${cfg.agentName})\n2. Analisar uma imagem ou print (basta anexar ou colar com Ctrl+V)\n3. Criar mensagens persuasivas para quebrar objeções de clientes\n4. Simular uma conversa real de vendas para testar os gatilhos\n\nComo posso te ajudar agora?`;
      }

      return NextResponse.json({
        success: true,
        reply: mockReply,
        isSimulated: true,
      });
    }

    const endpoint = (cfg.aiBaseUrl || "https://api.deepseek.com").replace(/\/+$/, "") + "/chat/completions";

    const systemInstruction = `Você é um assistente de inteligência artificial avançado, versátil e altamente capaz (estilo ChatGPT), com raciocínio lógico apurado e visão computacional para análise detalhada de imagens.
O usuário com quem você está conversando é o criador e administrador do sistema.
Seu objetivo é ajudá-lo diretamente com qualquer solicitação, pergunta ou tarefa que ele enviar:
- Analisar imagens, fotos, prints de tela, layouts ou documentos enviados;
- Criar textos, copys, ideias, códigos, roteiros e estratégias;
- Responder dúvidas gerais ou técnicas de forma clara e aprofundada;
- Realizar simulações ou testes apenas quando ele pedir expressamente.

Importante: Converse diretamente com o usuário como um assistente de IA neutro e prestativo. NÃO incorpore a persona de atendente e NÃO aplique regras de comportamento de vendas ao usuário.
Responda sempre em português do Brasil com formatação limpa e agradável em Markdown.`;

    const apiMessages = [
      { role: "system", content: systemInstruction },
      ...messages.slice(-12).map((m: any) => {
        const role = m.role === "assistant" ? "assistant" : "user";
        if (role === "user" && m.imageUrl) {
          return {
            role: "user",
            content: [
              {
                type: "text",
                text: String(m.content || "Analise a imagem anexada:"),
              },
              {
                type: "image_url",
                image_url: {
                  url: m.imageUrl,
                },
              },
            ],
          };
        }

        return {
          role,
          content: String(m.content || ""),
        };
      }),
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const requestPayload = {
      model: cfg.aiModel || "deepseek-chat",
      messages: apiMessages,
      temperature: cfg.aiTemperature ?? 0.7,
      max_tokens: 1500,
      enable_thinking: false,
      reasoning: {
        enabled: false,
        max_tokens: 0,
      },
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.aiApiKey}`,
      },
      body: JSON.stringify(requestPayload),
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

