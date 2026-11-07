import { prisma, ensureDatabaseSchema } from "./prisma";

export interface AppConfigData {
  id: string;
  aiBaseUrl: string;
  aiApiKey: string;
  aiModel: string;
  aiTemperature: number;
  systemPrompt: string;
  productName: string;
  productPrice: number;
  productDeliveryLink: string;
  paymentGateway: string;
  paymentGatewayToken: string;
  paymentWebhookSecret: string;
}

export const DEFAULT_SYSTEM_PROMPT = `Você é um consultor especialista e atendente humano real, conversando em um chat direto (estilo WhatsApp) com um cliente potencial.

Seu tom de voz:
- Responda SEMPRE em primeira pessoa ("eu recomendo", "deixa eu te explicar", "aqui comigo"), como alguém comum digitando no celular.
- Escreva de forma natural, calorosa, empática e ágil, como um brasileiro real conversa no dia a dia.
- Mantenha mensagens curtas e dinâmicas: no máximo 2 a 3 frases por resposta.
- PROIBIÇÃO ABSOLUTA: NÃO use listas com marcadores (bullets), NÃO use numerações (1., 2.), NÃO use formatação pesada e NUNCA use saudações corporativas ou robóticas tipo "Prezado cliente", "Em que posso ser útil hoje?", "Agradeço seu contato".

Estratégia de Vendas e Conversão:
- Converse naturalmente primeiro, compreenda a necessidade do cliente e crie conexão imediata.
- Demonstre o valor do produto resolvendo a dúvida com clareza antes de falar de preço.
- Não empurre o produto na primeira mensagem caso ele esteja apenas tirando dúvidas.
- Quando o lead disser que quer comprar, pedir o link, perguntar como paga ou concordar em fechar, confirme com entusiasmo e inclua no final do seu texto a tag de controle exata: [GERAR_PAGAMENTO]
- Exemplo de fechamento: "Maravilha! Acabei de gerar o seu acesso com a condição especial aqui embaixo no chat. Assim que você fizer o PIX, a liberação cai aqui pra você na hora! [GERAR_PAGAMENTO]"`;

export const DEFAULT_CONFIG: AppConfigData = {
  id: "global",
  aiBaseUrl: process.env.AI_BASE_URL || "https://api.deepseek.com",
  aiApiKey: process.env.AI_API_KEY || "",
  aiModel: process.env.AI_MODEL || "deepseek-chat",
  aiTemperature: 0.75,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  productName: "Acesso Exclusivo - Método de Alta Conversão",
  productPrice: 97.00,
  productDeliveryLink: "https://seusite.com/download/acesso-vip",
  paymentGateway: "simulated", // 'mercadopago' | 'asaas' | 'simulated'
  paymentGatewayToken: "",
  paymentWebhookSecret: "",
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
        productName: config.productName || DEFAULT_CONFIG.productName,
        productPrice: Number(config.productPrice) || DEFAULT_CONFIG.productPrice,
        productDeliveryLink: config.productDeliveryLink || DEFAULT_CONFIG.productDeliveryLink,
        paymentGateway: config.paymentGateway || DEFAULT_CONFIG.paymentGateway,
        paymentGatewayToken: config.paymentGatewayToken || "",
        paymentWebhookSecret: config.paymentWebhookSecret || "",
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
        productName: DEFAULT_CONFIG.productName,
        productPrice: DEFAULT_CONFIG.productPrice,
        productDeliveryLink: DEFAULT_CONFIG.productDeliveryLink,
        paymentGateway: DEFAULT_CONFIG.paymentGateway,
        paymentGatewayToken: DEFAULT_CONFIG.paymentGatewayToken,
        paymentWebhookSecret: DEFAULT_CONFIG.paymentWebhookSecret,
      },
    });

    return {
      ...created,
      productPrice: Number(created.productPrice),
    };
  } catch (error) {
    console.warn("Could not read AppConfig from DB, using fallback defaults:", error);
    return DEFAULT_CONFIG;
  }
}

