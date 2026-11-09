import { prisma, ensureDatabaseSchema } from "./prisma";

export interface MediaItem {
  id: string; // ex: 'amostra-1', 'resultado-faturamento'
  title: string;
  url: string;
  description?: string;
  triggerInstruction: string; // Ex: 'Envie quando o cliente perguntar se funciona ou pedir provas de alunos'
  viewOnce?: boolean; // Se true, o cliente só pode abrir e visualizar a foto 1 única vez
}

export interface PromptTag {
  id: string; // identificador único
  name: string; // Token formatado, ex: "[NOME]", "[CHAVE_PIX]"
  description: string; // Explicação de uso
  value: string; // Texto que substitui no prompt ou ação executada
  type: "variable" | "action"; // 'variable' = substitui texto no prompt; 'action' = gatilho de controle
  category?: "general" | "timer" | "action";
  isSystem?: boolean; // Tags nativas do sistema protegidas
}

export const SYSTEM_DEFAULT_TAGS: PromptTag[] = [
  {
    id: "tag_nome",
    name: "[NOME]",
    description: "Substitui automaticamente pelo nome do atendente configurado.",
    value: "Dinâmico (Nome do Atendente)",
    type: "variable",
    category: "general",
    isSystem: true,
  },
  {
    id: "tag_tempo_pos_venda",
    name: "[TEMPO-POS-VENDA]",
    description: "Tempo máximo de conversa e suporte pós-compra após o pagamento PIX.",
    value: "Dinâmico (Minutos Pós-Venda)",
    type: "variable",
    category: "timer",
    isSystem: true,
  },
  {
    id: "tag_tempo_inatividade",
    name: "[TEMPO-INATIVIDADE]",
    description: "Tempo limite de silêncio do cliente antes de acionar a despedida por inatividade.",
    value: "Dinâmico (Minutos Inatividade)",
    type: "variable",
    category: "timer",
    isSystem: true,
  },
  {
    id: "tag_tempo_cooldown",
    name: "[TEMPO-COOLDOWN]",
    description: "Tempo de bloqueio que a atendente permanece ausente até poder voltar a falar.",
    value: "Dinâmico (Horas de Cooldown)",
    type: "variable",
    category: "timer",
    isSystem: true,
  },
  {
    id: "tag_gerar_pagamento",
    name: "[GERAR_PAGAMENTO]",
    description: "Gatilho de checkout: aciona a emissão automática do card PIX com QR Code.",
    value: "Gatilho de Ação Automático",
    type: "action",
    category: "action",
    isSystem: true,
  },
  {
    id: "tag_encerrar_conversa",
    name: "[ENCERRAR_CONVERSA]",
    description: "Gatilho de encerramento: encerra o atendimento com desculpa do namorado e ativa cooldown.",
    value: "Gatilho de Ação Automático",
    type: "action",
    category: "action",
    isSystem: true,
  },
];

export interface AppConfigData {
  id: string;
  slug?: string;
  bio?: string;
  isActive?: boolean;
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
  customTags?: string; // JSON string of PromptTag[]
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
- Quando o sistema enviar a instrução de que o tempo acabou (pós-venda de [TEMPO-POS-VENDA], inatividade de [TEMPO-INATIVIDADE] ou demora no PIX): Use IMEDIATAMENTE a desculpa do namorado ("olha, preciso ir correndo… ele acabou de chegar em casa e não posso deixar ele me ver no celular. mas daqui a [TEMPO-COOLDOWN] eu volto, me chama amanhã tá?") e inclua a tag [ENCERRAR_CONVERSA]. Nunca saia do personagem ao fazer isso.`;

export const DEFAULT_MEDIA_INSTRUCTIONS = `Diretrizes de Envio de Mídias para a IA:
1. Envie imagens/amostras apenas quando o cliente solicitar provas, fizer perguntas pertinentes ou quando a imagem enriquecer diretamente a explicação.
2. Nunca dispare imagens sem contexto ou de forma aleatória.
3. Para disparar o envio de uma imagem cadastrada, inclua no final da sua mensagem a tag de controle exata correspondente: [ENVIAR_MIDIA:id_da_midia].
4. Envie no máximo 1 mídia por vez para manter a conversa humanizada e dinâmica.`;

export const DEFAULT_CONFIG: AppConfigData = {
  id: "global",
  slug: "gabriel",
  bio: "Especialista em Vendas e Atendimento",
  isActive: true,
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
  customTags: "[]",
  maxAgentPhotos: 3,
  postPurchaseMinutes: 10,
  nonPurchaseMinutes: 15,
  cooldownHours: 24,
};

function mapAttendantToConfig(attendant: any): AppConfigData {
  return {
    id: attendant.id,
    slug: attendant.slug,
    bio: attendant.bio || "Especialista em Vendas e Atendimento",
    isActive: typeof attendant.isActive !== "undefined" ? Boolean(attendant.isActive) : true,
    aiBaseUrl: attendant.aiBaseUrl || DEFAULT_CONFIG.aiBaseUrl,
    aiApiKey: attendant.aiApiKey || process.env.AI_API_KEY || "",
    aiModel: attendant.aiModel || DEFAULT_CONFIG.aiModel,
    aiTemperature: attendant.aiTemperature ?? DEFAULT_CONFIG.aiTemperature,
    systemPrompt: attendant.systemPrompt || DEFAULT_CONFIG.systemPrompt,
    agentName: attendant.name || DEFAULT_CONFIG.agentName,
    agentAvatar: attendant.avatar || "",
    productName: attendant.productName || DEFAULT_CONFIG.productName,
    productPrice: Number(attendant.productPrice) || DEFAULT_CONFIG.productPrice,
    productDeliveryLink: attendant.productDeliveryLink || DEFAULT_CONFIG.productDeliveryLink,
    paymentGateway: attendant.paymentGateway || DEFAULT_CONFIG.paymentGateway,
    paymentGatewayToken: attendant.paymentGatewayToken || "",
    paymentWebhookSecret: attendant.paymentWebhookSecret || "",
    mediaCatalog: attendant.mediaCatalog || "[]",
    mediaInstructions: attendant.mediaInstructions || DEFAULT_CONFIG.mediaInstructions,
    customTags: attendant.customTags || attendant.custom_tags || "[]",
    maxAgentPhotos: attendant.maxAgentPhotos ?? 3,
    postPurchaseMinutes: attendant.postPurchaseMinutes ?? 10,
    nonPurchaseMinutes: attendant.nonPurchaseMinutes ?? 15,
    cooldownHours: attendant.cooldownHours ?? 24,
  };
}

export async function getAllAttendants(onlyActive = false): Promise<AppConfigData[]> {
  try {
    await ensureDatabaseSchema();
    const where = onlyActive ? { isActive: true } : {};
    const list = await prisma.attendant.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });
    return list.map(mapAttendantToConfig);
  } catch (err) {
    console.warn("getAllAttendants fallback:", err);
    return [DEFAULT_CONFIG];
  }
}

export async function getAppConfig(identifier?: string): Promise<AppConfigData> {
  try {
    await ensureDatabaseSchema();

    // 1. If identifier provided, lookup by slug or id
    if (identifier) {
      const found = await prisma.attendant.findFirst({
        where: {
          OR: [{ id: identifier }, { slug: identifier }],
        },
      });
      if (found) {
        return mapAttendantToConfig(found);
      }
    }

    // 2. Otherwise get the first active attendant
    const firstActive = await prisma.attendant.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
    if (firstActive) {
      return mapAttendantToConfig(firstActive);
    }

    // 3. Fallback to any attendant
    const anyAttendant = await prisma.attendant.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (anyAttendant) {
      return mapAttendantToConfig(anyAttendant);
    }

    // 4. Fallback to legacy app_configs or DEFAULT_CONFIG
    const legacy = await prisma.appConfig.findUnique({
      where: { id: "global" },
    });
    if (legacy) {
      return {
        id: legacy.id,
        slug: "gabriel",
        bio: "Especialista em Vendas e Atendimento",
        isActive: true,
        aiBaseUrl: legacy.aiBaseUrl || DEFAULT_CONFIG.aiBaseUrl,
        aiApiKey: legacy.aiApiKey || process.env.AI_API_KEY || "",
        aiModel: legacy.aiModel || DEFAULT_CONFIG.aiModel,
        aiTemperature: legacy.aiTemperature ?? DEFAULT_CONFIG.aiTemperature,
        systemPrompt: legacy.systemPrompt || DEFAULT_CONFIG.systemPrompt,
        agentName: legacy.agentName || DEFAULT_CONFIG.agentName,
        agentAvatar: legacy.agentAvatar || "",
        productName: legacy.productName || DEFAULT_CONFIG.productName,
        productPrice: Number(legacy.productPrice) || DEFAULT_CONFIG.productPrice,
        productDeliveryLink: legacy.productDeliveryLink || DEFAULT_CONFIG.productDeliveryLink,
        paymentGateway: legacy.paymentGateway || DEFAULT_CONFIG.paymentGateway,
        paymentGatewayToken: legacy.paymentGatewayToken || "",
        paymentWebhookSecret: legacy.paymentWebhookSecret || "",
        mediaCatalog: legacy.mediaCatalog || "[]",
        mediaInstructions: legacy.mediaInstructions || DEFAULT_CONFIG.mediaInstructions,
        maxAgentPhotos: legacy.maxAgentPhotos ?? 3,
        postPurchaseMinutes: (legacy as any).postPurchaseMinutes ?? 10,
        nonPurchaseMinutes: (legacy as any).nonPurchaseMinutes ?? 15,
        cooldownHours: (legacy as any).cooldownHours ?? 24,
      };
    }

    return DEFAULT_CONFIG;
  } catch (error) {
    console.warn("Could not read attendant config from DB, using fallback defaults:", error);
    return DEFAULT_CONFIG;
  }
}
