import { getAppConfig, MediaItem, DEFAULT_MEDIA_INSTRUCTIONS, PromptTag } from "./config";
import { splitIntoBubbles } from "./humanizer";

export interface ChatHistoryItem {
  sender: "user" | "agent" | "system";
  content: string;
  imageUrl?: string;
}

export interface AIResponseResult {
  rawText: string;
  bubbles: string[];
  shouldGeneratePayment: boolean;
  mediaIdToSend: string | null;
  shouldEndConversation: boolean;
  isFallback: boolean;
}

const HUMAN_FALLBACK_RESPONSES = [
  "Opa, deu uma leve oscilada na minha conexão aqui por um segundo! Mas já tô de volta. Me conta mais sobre o que você tá buscando resolver primeiro?",
  "Um instante, dei uma olhadinha aqui no sistema pra te responder com exatidão! Pode me detalhar qual é a sua principal dúvida agora?",
  "Opa, tô aqui! Tava só conferindo os detalhes do seu caso. Quer que eu te explique o passo a passo de como funciona?",
];

export async function generateAIResponse(params: {
  userName: string;
  history: ChatHistoryItem[];
  userMessage: string;
  imageUrl?: string;
  systemDirective?: string;
  attendantId?: string;
  clientStatus?: string;
}): Promise<AIResponseResult> {
  const config = await getAppConfig(params.attendantId);

  // Parse media catalog
  let mediaCatalogItems: MediaItem[] = [];
  try {
    mediaCatalogItems = JSON.parse(config.mediaCatalog || "[]");
  } catch { }

  // If no API key configured, use a sensible simulation/contingency mode
  if (!config.aiApiKey) {
    console.warn("AI API Key not set. Using intelligent simulated attendant response.");
    const simulated = simulateAttendantResponse(
      params.userMessage,
      params.userName,
      config.productPrice,
      params.imageUrl,
      mediaCatalogItems,
      params.clientStatus
    );
    return simulated;
  }

  // Count how many media photos the agent has already sent in this session
  const agentPhotosSent = params.history.filter(
    (h) => h.sender === "agent" && Boolean(h.imageUrl)
  ).length;
  const maxAgentPhotos = typeof config.maxAgentPhotos === "number" ? config.maxAgentPhotos : 3;
  const isAgentQuotaExhausted = agentPhotosSent >= maxAgentPhotos;

  // Format media section for the prompt
  let mediaSection = "";
  if (isAgentQuotaExhausted) {
    mediaSection = `\n\nSTATUS DE MÍDIAS:
ATENÇÃO: Você já enviou o limite máximo de ${maxAgentPhotos} foto(s)/amostra(s) para este cliente (${agentPhotosSent}/${maxAgentPhotos}).
Você NÃO TEM PERMISSÃO de enviar mais nenhuma foto. NÃO use a tag [ENVIAR_MIDIA] sob nenhuma hipótese.
Se o cliente pedir mais fotos ou amostras, diga educadamente e com segurança que já compartilhou as amostras oficiais disponíveis e conduza a conversa para fechar o acesso completo com [GERAR_PAGAMENTO].`;
  } else if (mediaCatalogItems.length > 0) {
    mediaSection = `\n\nCATÁLOGO DE MÍDIAS E INSTRUÇÕES DE DISPARO:
Cota de fotos: Você já enviou ${agentPhotosSent} de no máximo ${maxAgentPhotos} foto(s) permitidas para este atendimento.
${config.mediaInstructions || DEFAULT_MEDIA_INSTRUCTIONS}

Mídias que você tem permissão de enviar:
${mediaCatalogItems
        .map(
          (m) =>
            `- Mídia [ID: ${m.id}]: "${m.title}". ${m.description ? `Detalhes: ${m.description}. ` : ""
            }Instrução de Disparo: ${m.triggerInstruction}. Para enviar esta imagem ao cliente, adicione exatamente no final do seu texto a tag: [ENVIAR_MIDIA:${m.id}]`
        )
        .join("\n")}`;
  }

  // Replace standard dynamic time & name variables
  const effectiveAgentName = config.agentName || "Gabriel Siqueira";
  const postPurchaseTimeStr = `${config.postPurchaseMinutes || 10} minutos`;
  const nonPurchaseTimeStr = `${config.nonPurchaseMinutes || 15} minutos`;
  const cooldownTimeStr = `${config.cooldownHours || 24} horas`;

  let processedPrompt = config.systemPrompt
    .replace(/\[NOME\]/gi, effectiveAgentName)
    .replace(/\[TEMPO[-_]POS[-_]VENDA\]/gi, postPurchaseTimeStr)
    .replace(/\[TEMPO[-_]INATIVIDADE\]/gi, nonPurchaseTimeStr)
    .replace(/\[TEMPO[-_]COOLDOWN\]/gi, cooldownTimeStr)
    .replace(/\[TEMPO\]/gi, postPurchaseTimeStr);

  if (params.clientStatus) {
    processedPrompt = processedPrompt
      .replace(/\[STATUS_CLIENTE\]/gi, params.clientStatus)
      .replace(/\[STATUS[-_]CLIENTE\]/gi, params.clientStatus);
  }

  // Replace any custom configured tags
  try {
    const customTags: PromptTag[] = JSON.parse(config.customTags || "[]");
    for (const tag of customTags) {
      if (tag.value && tag.type === "variable" && !tag.isSystem) {
        const cleanName = tag.name.replace(/^\[+|\]+$/g, "");
        const regex = new RegExp(`\\[${cleanName}\\]`, "gi");
        processedPrompt = processedPrompt.replace(regex, tag.value);
      }
    }
  } catch {}

  let directiveSection = "";
  if (params.systemDirective) {
    directiveSection = `\n\n🚨 INSTRUÇÃO DO SISTEMA:\n${params.systemDirective}\nExecute esta instrução imediatamente mantendo total naturalidade em primeira pessoa e sem sair do personagem.`;
  }

  let statusSection = "";
  if (params.clientStatus) {
    statusSection = `\n\n[STATUS_ATUAL_DO_CLIENTE]\n${params.clientStatus}`;
  }

  // Build OpenAI-compatible chat payload
  const systemMessage = `${processedPrompt}
  
Informações do atendente, visitante e contexto atual:
- Seu Nome (Atendente): ${effectiveAgentName}
- Nome do visitante: ${params.userName || "Cliente"}
- Nome do Produto: ${config.productName}
- Preço do Produto: R$ ${config.productPrice.toFixed(2)}${
  params.clientStatus ? `\n- Status do Cliente: ${params.clientStatus}` : ""
}
- Lembre-se: quando o cliente concordar em comprar ou pedir para pagar, inclua no final do seu texto a tag [GERAR_PAGAMENTO]. NUNCA invente links de download falsos.
- Se o cliente enviar imagens ou fotos (comprovantes, prints, fotos de produtos ou dúvidas), analise com atenção os elementos visuais e responda de forma natural e precisa.${mediaSection}${directiveSection}${statusSection}`;

  // Format history messages into OpenAI/DeepSeek multimodal format
  const apiMessages = [
    { role: "system", content: systemMessage },
    ...params.history.slice(-8).map((h) => {
      const cleanContent = h.content
        .replace(/\[GERAR_PAGAMENTO\]/g, "")
        .replace(/\[ENVIAR_MIDIA:[^\]]+\]/g, "")
        .replace(/\[ENCERRAR_CONVERSA\]/g, "")
        .replace(/\[FINALIZAR_CONVERSA\]/g, "")
        .replace(/\[STATUS_CLIENTE:[^\]]+\]/gi, "")
        .replace(/\[STATUS_CLIENTE\]/gi, "")
        .trim();

      if (h.sender === "user" && h.imageUrl) {
        return {
          role: "user",
          content: [
            {
              type: "text",
              text: cleanContent || "Veja a foto anexada:",
            },
            {
              type: "image_url",
              image_url: {
                url: h.imageUrl,
              },
            },
          ],
        };
      }

      return {
        role: h.sender === "user" ? "user" : "assistant",
        content: cleanContent || "Olá",
      };
    }),
  ];

  // Guarantee valid dialogue turn: the last message to the model must always be from the user
  while (apiMessages.length > 1 && apiMessages[apiMessages.length - 1].role === "assistant") {
    apiMessages.pop();
  }

  // If there are no user messages to respond to, abort
  if (apiMessages.length <= 1) {
    return {
      rawText: "",
      bubbles: [],
      shouldGeneratePayment: false,
      mediaIdToSend: null,
      shouldEndConversation: false,
      isFallback: false,
    };
  }

  // Call API with 12s timeout for multimodal processing
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const endpoint = config.aiBaseUrl.replace(/\/+$/, "") + "/chat/completions";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.aiApiKey}`,
      },
      body: JSON.stringify({
        model: config.aiModel || "deepseek-chat",
        messages: apiMessages,
        temperature: config.aiTemperature ?? 0.75,
        max_tokens: 600,
        enable_thinking: false,
        reasoning: {
          enabled: false,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`AI API returned error ${response.status}:`, errText);
      throw new Error(`AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const assistantContent = data.choices?.[0]?.message?.content || "";

    if (!assistantContent) {
      throw new Error("Empty AI response received");
    }

    return processAIContent(assistantContent);
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    console.error("AI service error or timeout occurred:", err);

    // Pick human contingency response
    const fallbackText =
      HUMAN_FALLBACK_RESPONSES[Math.floor(Math.random() * HUMAN_FALLBACK_RESPONSES.length)];

    return {
      rawText: fallbackText,
      bubbles: splitIntoBubbles(fallbackText),
      shouldGeneratePayment: false,
      mediaIdToSend: null,
      shouldEndConversation: false,
      isFallback: true,
    };
  }
}

/**
 * Process raw AI text: inspect control tags [GERAR_PAGAMENTO], [ENVIAR_MIDIA:id], [ENCERRAR_CONVERSA]
 */
function processAIContent(rawContent: string): AIResponseResult {
  const paymentTagRegex = /\[GERAR_PAGAMENTO\]/i;
  const shouldGeneratePayment = paymentTagRegex.test(rawContent);

  const mediaTagRegex = /\[ENVIAR_MIDIA:([a-zA-Z0-9_-]+)\]/i;
  const mediaMatch = rawContent.match(mediaTagRegex);
  const mediaIdToSend = mediaMatch ? mediaMatch[1] : null;

  const endTagRegex = /\[(ENCERRAR_CONVERSA|FINALIZAR_CONVERSA)\]/i;
  const shouldEndConversation = endTagRegex.test(rawContent);

  // Clean tags out of user-facing text
  const cleanedText = rawContent
    .replace(paymentTagRegex, "")
    .replace(mediaTagRegex, "")
    .replace(endTagRegex, "")
    .replace(/\[STATUS_CLIENTE:[^\]]+\]/gi, "")
    .replace(/\[STATUS_CLIENTE\]/gi, "")
    .trim();

  // Split into 1 to 3 conversational bubbles
  const bubbles = splitIntoBubbles(cleanedText);

  return {
    rawText: cleanedText,
    bubbles: bubbles.length > 0 ? bubbles : [cleanedText],
    shouldGeneratePayment,
    mediaIdToSend,
    shouldEndConversation,
    isFallback: false,
  };
}

/**
 * Intelligent simulation fallback when no external AI key is entered yet.
 */
function simulateAttendantResponse(
  userMsg: string,
  userName: string,
  price: number,
  imageUrl?: string,
  mediaCatalog: MediaItem[] = [],
  clientStatus?: string
): AIResponseResult {
  if (imageUrl) {
    const text = `Recebi a sua foto aqui com sucesso, ${userName}! Deixa eu dar uma olhada nela com calma pra te orientar da melhor forma. Você quer me explicar mais algum detalhe sobre o que tá na imagem?`;
    return processAIContent(text);
  }

  if (clientStatus === "[STATUS_CLIENTE: VENDA_CONCLUIDA]") {
    const text = `Oi ${userName}! Seu pagamento já tá 100% confirmado! Conseguiu acessar tudo certinho pelo link de entrega? Qualquer dúvida que tiver, pode me mandar aqui!`;
    return processAIContent(text);
  }

  if (clientStatus === "[STATUS_CLIENTE: VENDA_DESISTIU]") {
    const text = `Tudo bem, ${userName}! Fica em paz. Se precisar de algo no futuro ou quiser tirar alguma dúvida, tô por aqui!`;
    return processAIContent(text);
  }

  const lower = (userMsg || "").toLowerCase();

  // If user asks for proof / sample and media exists, test trigger
  if (
    (lower.includes("amostra") ||
      lower.includes("prova") ||
      lower.includes("print") ||
      lower.includes("funciona") ||
      lower.includes("exemplo")) &&
    mediaCatalog.length > 0
  ) {
    const targetMedia = mediaCatalog[0];
    const text = `Olha só, ${userName}! Deixa eu te mostrar na prática um exemplo real de como funciona: [ENVIAR_MIDIA:${targetMedia.id}]`;
    return processAIContent(text);
  }

  if (lower.includes("acabou de entrar") || lower.includes("boas-vindas") || lower.includes("se apresentou")) {
    const text = `Opa, ${userName}! Seja muito bem-vindo por aqui. Eu sou o Gabriel, tô à sua disposição! Me conta: o que te trouxe aqui hoje?`;
    return processAIContent(text);
  }

  if (
    lower.includes("comprar") ||
    lower.includes("quero") ||
    lower.includes("pix") ||
    lower.includes("pagar") ||
    lower.includes("fechar") ||
    lower.includes("link") ||
    lower.includes("adquirir") ||
    lower.includes("como faco") ||
    lower.includes("como faço")
  ) {
    const text = `Maravilha, ${userName}! Acabei de gerar o seu acesso com a condição especial aqui na tela por apenas R$ ${price.toFixed(
      2
    )}. Assim que você fizer o PIX, o seu acesso é liberado automaticamente aqui no chat! [GERAR_PAGAMENTO]`;
    return processAIContent(text);
  }

  if (lower.includes("preço") || lower.includes("preco") || lower.includes("quanto") || lower.includes("valor")) {
    const text = `O valor oficial é de R$ ${price.toFixed(
      2
    )}, com acesso completo e suporte incluso. E você pode pagar direto no PIX com liberação imediata. Faz sentido pra você começar hoje?`;
    return processAIContent(text);
  }

  if (lower.includes("ola") || lower.includes("olá") || lower.includes("oi") || lower.includes("boa tarde") || lower.includes("bom dia")) {
    const text = `Oi, ${userName}! Tudo bem com você? Deixa eu te ajudar. Você já conhece como nosso método funciona ou tá chegando agora?`;
    return processAIContent(text);
  }

  const text = `Entendi perfeitamente, ${userName}. O objetivo principal aqui é te economizar tempo e destravar seus resultados direto ao ponto, sem enrolação. Se tiver qualquer dúvida pontual, me fala que eu te explico agora!`;
  return processAIContent(text);
}
