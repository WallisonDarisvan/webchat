import { MediaItem, PromptTag } from "@/lib/config";

export interface AdminConfig {
  id?: string;
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
  productDeliveryMessage?: string;
  paymentGateway: string;
  paymentGatewayToken: string;
  paymentWebhookSecret: string;
  mediaCatalog: string; // JSON string of MediaItem[]
  mediaInstructions: string;
  customTags?: string; // JSON string of PromptTag[]
  maxAgentPhotos: number;
  postPurchaseMinutes?: number;
  nonPurchaseMinutes?: number;
  cooldownHours?: number;
}

export interface StatsData {
  stats: {
    totalSessions: number;
    totalMessages: number;
    totalOrders: number;
    paidOrdersCount: number;
    totalRevenue: number;
  };
  recentOrders: Array<{
    id: string;
    amount: number;
    status: string;
    deliveryLink: string;
    createdAt: string;
    paidAt?: string;
    session: {
      userName: string;
      deviceId: string;
      lastIp: string;
    };
  }>;
  recentSessions: Array<{
    id: string;
    userName: string;
    lastIp: string;
    userAgent: string;
    updatedAt: string;
    _count: { messages: number };
  }>;
}

export type AdminTabType =
  | "profile"
  | "ai"
  | "prompt"
  | "timer"
  | "tags"
  | "media"
  | "product"
  | "stats";
