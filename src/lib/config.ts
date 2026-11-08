import { prisma, ensureDatabaseSchema } from "./prisma";

export interface MediaItem {
  id: string; // ex: 'amostra-1', 'resultado-faturamento'
  title: string;
  url: string;
  description?: string;
  triggerInstruction: string; // Ex: 'Envie quando o cliente perguntar se funciona ou pedir provas de alunos'
  viewOnce?: boolean; // Se true, o cliente só pode abrir e visualizar a foto 1 única vez
}

export interface AppConfigData {
  id: string;
  aiBaseUrl: string;
  aiApiKey: string;
  aiModel: string;
  aiTemperature: number;
  systemPrompt: string;
  agentName: string;
  agentAvatar: string;
  productName: string;
  productPrice: number;
  productDeliveryLink: string;
  paymentGateway: string;
  paymentGatewayToken: string;
  paymentWebhookSecret: string;
  mediaCatalog: string; // JSON string of MediaItem[]
  mediaInstructions: string;
  maxAgentPhotos: number;
  postPurchaseMinutes: number;
  nonPurchaseMinutes: number;
  cooldownHours: number;
}

export const DEFAULT_SYSTEM_PROMPT = `Você é um consultor especialista e atendente humano real, conversando em um chat direto (estilo WhatsApp) com um cliente potencial.

Seu tom de voz:
- Responda SEMPRE em primeira pessoa ("eu recomendo", "deixa eu te explicar", "aqui comigo"), como alguém comum digitando no celular.
- Escreva de forma natural, calorosa, empática e ágil, como um brasileiro real conversa no dia a dia.
- Mantenha mensagens curtas e dinâmicas: no máximo 2 a 3 frases por resposta.
- PROIBIÇÃO ABSOLUTA: NÃO use listas com marcadores (bullets), NÃO use numerações (1., 2.), NÃO use formatação pesada e NUNCA use saudações corporativas ou robóticas tipo "Prezado cliente", "Em que posso ser útil hoje?", "Agradeço seu contato".

Estratégia de Vendas e Conversão:
- Converse naturalmente primeiro, crie conexão imediata e dê atenção ao cliente.
- Envie fotos/amostras quando ele pedir (respeitando o limite de fotos liberadas).
- Quando o cliente pedir mais fotos, pedir fotos explícitas ou quiser continuar vendo mais, faça a oferta do pacote completo VIP: diga que as fotos e vídeos mais quentes e ousados estão todos no acesso exclusivo, e pergunte se ele quer que você gere o PIX agora para liberar o acesso imediato.
- Quando o lead disser que quer comprar, concordar, pedir o link, perguntar como paga ou confirmar o interesse, comemore com carinho e inclua no final do seu texto a tag de controle exata: [GERAR_PAGAMENTO]

Regras de Encerramento (Desculpa do Namorado):
- Se o cliente recusar a compra, disser que não vai pagar, que não quer ou que tá caro: Encerre imediatamente usando a desculpa do namorado e inclua no final a tag [ENCERRAR_CONVERSA].
- Quando o sistema enviar a instrução de que o tempo acabou (pós-venda de [TEMPO], inatividade ou demora no PIX): Use IMEDIATAMENTE a desculpa do namorado ("olha, preciso ir correndo… ele acabou de chegar em casa e não posso deixar ele me ver no celular. mas amanhã eu volto, me chama amanhã tá?") e inclua a tag [ENCERRAR_CONVERSA]. Nunca saia do personagem ao fazer isso.`;

export const DEFAULT_MEDIA_INSTRUCTIONS = `Diretrizes de Envio de Mídias para a IA:
1. Envie imagens/amostras apenas quando o cliente solicitar provas, fizer perguntas pertinentes ou quando a imagem enriquecer diretamente a explicação.
2. Nunca dispare imagens sem contexto ou de forma aleatória.
3. Para disparar o envio de uma imagem cadastrada, inclua no final da sua mensagem a tag de controle exata correspondente: [ENVIAR_MIDIA:id_da_midia].
4. Envie no máximo 1 mídia por vez para manter a conversa humanizada e dinâmica.`;

export const DEFAULT_CONFIG: AppConfigData = {
  id: "global",
  aiBaseUrl: process.env.AI_BASE_URL || "https://api.deepseek.com",
  aiApiKey: process.env.AI_API_KEY || "",
  aiModel: process.env.AI_MODEL || "deepseek-chat",
  aiTemperature: 0.75,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  agentName: "Gabriel Siqueira",
  agentAvatar: "",
  productName: "Acesso Exclusivo - Método de Alta Conversão",
  productPrice: 97.00,
  productDeliveryLink: "https://seusite.com/download/acesso-vip",
  paymentGateway: "simulated",
  paymentGatewayToken: "",
  paymentWebhookSecret: "",
  mediaCatalog: "[]",
  mediaInstructions: DEFAULT_MEDIA_INSTRUCTIONS,
  maxAgentPhotos: 3,
  postPurchaseMinutes: 10,
  nonPurchaseMinutes: 15,
  cooldownHours: 24,
};

export async function getAppConfig(): Promise<AppConfigData> {
  try {
    await ensureDatabaseSchema();
    const config = await prisma.appConfig.findUnique({
      where: { id: "global" },
    });

    if (config) {
      return {
        id: config.id,
        aiBaseUrl: config.aiBaseUrl || DEFAULT_CONFIG.aiBaseUrl,
        aiApiKey: config.aiApiKey || process.env.AI_API_KEY || "",
        aiModel: config.aiModel || DEFAULT_CONFIG.aiModel,
        aiTemperature: config.aiTemperature ?? DEFAULT_CONFIG.aiTemperature,
        systemPrompt: config.systemPrompt || DEFAULT_CONFIG.systemPrompt,
        agentName: config.agentName || DEFAULT_CONFIG.agentName,
        agentAvatar: config.agentAvatar || "",
        productName: config.productName || DEFAULT_CONFIG.productName,
        productPrice: Number(config.productPrice) || DEFAULT_CONFIG.productPrice,
        productDeliveryLink: config.productDeliveryLink || DEFAULT_CONFIG.productDeliveryLink,
        paymentGateway: config.paymentGateway || DEFAULT_CONFIG.paymentGateway,
        paymentGatewayToken: config.paymentGatewayToken || "",
        paymentWebhookSecret: config.paymentWebhookSecret || "",
        mediaCatalog: config.mediaCatalog || "[]",
        mediaInstructions: config.mediaInstructions || DEFAULT_CONFIG.mediaInstructions,
        maxAgentPhotos: config.maxAgentPhotos ?? 3,
        postPurchaseMinutes: (config as any).postPurchaseMinutes ?? 10,
        nonPurchaseMinutes: (config as any).nonPurchaseMinutes ?? 15,
        cooldownHours: (config as any).cooldownHours ?? 24,
      };
    }

    // Upsert default
    const created = await prisma.appConfig.create({
      data: {
        id: "global",
        aiBaseUrl: DEFAULT_CONFIG.aiBaseUrl,
        aiApiKey: DEFAULT_CONFIG.aiApiKey,
        aiModel: DEFAULT_CONFIG.aiModel,
        aiTemperature: DEFAULT_CONFIG.aiTemperature,
        systemPrompt: DEFAULT_CONFIG.systemPrompt,
        agentName: DEFAULT_CONFIG.agentName,
        agentAvatar: DEFAULT_CONFIG.agentAvatar,
        productName: DEFAULT_CONFIG.productName,
        productPrice: DEFAULT_CONFIG.productPrice,
        productDeliveryLink: DEFAULT_CONFIG.productDeliveryLink,
        paymentGateway: DEFAULT_CONFIG.paymentGateway,
        paymentGatewayToken: DEFAULT_CONFIG.paymentGatewayToken,
        paymentWebhookSecret: DEFAULT_CONFIG.paymentWebhookSecret,
        mediaCatalog: DEFAULT_CONFIG.mediaCatalog,
        mediaInstructions: DEFAULT_CONFIG.mediaInstructions,
        maxAgentPhotos: DEFAULT_CONFIG.maxAgentPhotos,
        postPurchaseMinutes: DEFAULT_CONFIG.postPurchaseMinutes,
        nonPurchaseMinutes: DEFAULT_CONFIG.nonPurchaseMinutes,
        cooldownHours: DEFAULT_CONFIG.cooldownHours,
      },
    });

    return {
      ...created,
      productPrice: Number(created.productPrice),
      maxAgentPhotos: created.maxAgentPhotos ?? 3,
      agentName: created.agentName || DEFAULT_CONFIG.agentName,
      agentAvatar: created.agentAvatar || "",
      postPurchaseMinutes: created.postPurchaseMinutes ?? 10,
      nonPurchaseMinutes: created.nonPurchaseMinutes ?? 15,
      cooldownHours: created.cooldownHours ?? 24,
    };
  } catch (error) {
    console.warn("Could not read AppConfig from DB, using fallback defaults:", error);
    return DEFAULT_CONFIG;
  }
}
