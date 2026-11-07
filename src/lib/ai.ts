import { getAppConfig } from "./config";
import { splitIntoBubbles } from "./humanizer";

export interface ChatHistoryItem {
  sender: "user" | "agent" | "system";
  content: string;
}

export interface AIResponseResult {
  rawText: string;
  bubbles: string[];
  shouldGeneratePayment: boolean;
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
}): Promise<AIResponseResult> {
  const config = await getAppConfig();

  // If no API key configured, use a sensible simulation/contingency mode
  if (!config.aiApiKey) {
    console.warn("AI API Key not set. Using intelligent simulated attendant response.");
    const simulated = simulateAttendantResponse(params.userMessage, params.userName, config.productPrice);
    return simulated;
  }

  // Build OpenAI-compatible chat payload
  const systemMessage = `${config.systemPrompt}
  
Informações do visitante e contexto atual:
- Nome do visitante: ${params.userName || "Cliente"}
- Nome do Produto: ${config.productName}
- Preço do Produto: R$ ${config.productPrice.toFixed(2)}
- Lembre-se: quando o cliente concordar em comprar ou pedir para pagar, inclua no final do seu texto a tag [GERAR_PAGAMENTO]. NUNCA invente links de download falsos.`;

  // Format history messages
  const apiMessages = [
    { role: "system", content: systemMessage },
    ...params.history.slice(-10).map((h) => ({
      role: h.sender === "user" ? "user" : "assistant",
      content: h.content.replace(/\[GERAR_PAGAMENTO\]/g, "").trim(),
    })),
    { role: "user", content: params.userMessage },
  ];

  // Call API with 10s timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

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
        max_tokens: 500,
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
      isFallback: true,
    };
  }
}

/**
 * Process raw AI text: inspect control tag [GERAR_PAGAMENTO] and split into multi-bubbles
 */
function processAIContent(rawContent: string): AIResponseResult {
  const paymentTagRegex = /\[GERAR_PAGAMENTO\]/i;
  const shouldGeneratePayment = paymentTagRegex.test(rawContent);

  // Clean the tag out of user-facing text
  const cleanedText = rawContent.replace(paymentTagRegex, "").trim();

  // Split into 1 to 3 conversational bubbles
  const bubbles = splitIntoBubbles(cleanedText);

  return {
    rawText: cleanedText,
    bubbles: bubbles.length > 0 ? bubbles : [cleanedText],
    shouldGeneratePayment,
    isFallback: false,
  };
}

/**
 * Intelligent simulation fallback when no external AI key is entered yet.
 * Allows instant out-of-the-box testing!
 */
function simulateAttendantResponse(
  userMsg: string,
  userName: string,
  price: number
): AIResponseResult {
  const lower = userMsg.toLowerCase();

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

