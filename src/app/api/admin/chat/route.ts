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
    const { messages, attendantId, systemPrompt, smartRouting, visionModel, textModel } = body;

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
    const isOpenRouter = endpoint.includes("openrouter.ai");

    const defaultSystemInstruction = `Você é um assistente de inteligência artificial avançado, versátil e altamente capaz (estilo ChatGPT), com raciocínio lógico apurado e visão computacional para análise detalhada de imagens.
O usuário com quem você está conversando é o criador e administrador do sistema.
Seu objetivo é ajudá-lo diretamente com qualquer solicitação, pergunta ou tarefa que ele enviar:
- Analisar imagens, fotos, prints de tela, layouts ou documentos enviados;
- Criar textos, copys, ideias, códigos, roteiros e estratégias;
- Responder dúvidas gerais ou técnicas de forma clara e aprofundada;
- Realizar simulações ou testes apenas quando ele pedir expressamente.

Importante: Converse diretamente com o usuário como um assistente de IA neutro e prestativo. NÃO incorpore a persona de atendente e NÃO aplique regras de comportamento de vendas ao usuário.
Responda sempre em português do Brasil com formatação limpa e agradável em Markdown.`;

    const effectiveSystemInstruction =
      typeof systemPrompt === "string" && systemPrompt.trim().length > 0
        ? systemPrompt.trim()
        : defaultSystemInstruction;

    const isSmartMode = smartRouting !== false;
    const effectiveTextModel = (typeof textModel === "string" && textModel.trim()) || "deepseek/deepseek-chat";
    const effectiveVisionModel = (typeof visionModel === "string" && visionModel.trim()) || "deepseek/deepseek-v4.1-flash";

    // Se estiver em modo inteligente dual e a última mensagem do usuário tiver imagem, a IA de visão lê e transcreve
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
    const imageDescriptionsMap: Record<string, string> = {};

    if (isSmartMode && lastUserMsg?.imageUrl) {
      try {
        const visionPayload = {
          model: effectiveVisionModel,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Descreva de forma concisa e direta os elementos visuais visíveis nesta imagem (pessoas, poses, roupas, cores, textos visíveis e ambiente). Seja estritamente objetivo, descritivo e factual.",
                },
                {
                  type: "image_url",
                  image_url: { url: lastUserMsg.imageUrl },
                },
              ],
            },
          ],
          max_tokens: 350,
          provider: isOpenRouter
            ? {
                order: ["DeepInfra", "Novita"],
                allow_fallbacks: true,
                data_collection: "deny",
              }
            : undefined,
        };

        const vRes = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cfg.aiApiKey}`,
          },
          body: JSON.stringify(visionPayload),
        });

        if (vRes.ok) {
          const vData = await vRes.json();
          const desc = vData.choices?.[0]?.message?.content || vData.choices?.[0]?.message?.reasoning || "";
          if (desc) {
            imageDescriptionsMap[lastUserMsg.imageUrl] = desc;
          }
        }
      } catch (vErr) {
        console.warn("Smart vision transcription warning:", vErr);
      }
    }

    const apiMessages = [
      { role: "system", content: effectiveSystemInstruction },
      ...messages.slice(-12).map((m: any) => {
        const role = m.role === "assistant" ? "assistant" : "user";
        if (role === "user" && m.imageUrl) {
          if (isSmartMode) {
            const desc = imageDescriptionsMap[m.imageUrl] || "Imagem anexada pelo usuário.";
            const userText = m.content && m.content.trim() ? m.content.trim() : "Analise a imagem anexada.";
            return {
              role: "user",
              content: `[O usuário anexou uma imagem ao chat. Descrição visual detalhada da imagem:\n"${desc}"]\n\nSolicitação do usuário: ${userText}`,
            };
          }

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
    const timeout = setTimeout(() => controller.abort(), 25000);

    const modelToUse = isSmartMode ? effectiveTextModel : (cfg.aiModel || "deepseek-chat");

    const requestPayload: Record<string, any> = {
      model: modelToUse,
      messages: apiMessages,
      temperature: cfg.aiTemperature ?? 0.7,
      max_tokens: 1500,
      enable_thinking: false,
      reasoning: {
        enabled: false,
        max_tokens: 0,
      },
    };

    if (isOpenRouter) {
      requestPayload.provider = {
        order: ["DeepInfra", "Novita"],
        allow_fallbacks: true,
        data_collection: "deny",
      };
    }

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

