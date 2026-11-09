"use client";

import React from "react";
import { DollarSign, RotateCcw, Check, Copy } from "lucide-react";
import { AdminConfig } from "../types";
import { DEFAULT_DELIVERY_MESSAGE } from "@/lib/config";

interface TabProductProps {
  config: AdminConfig;
  setConfig: React.Dispatch<React.SetStateAction<AdminConfig>>;
  appUrl: string;
  webhookCopied: boolean;
  onCopyWebhookUrl: () => void;
}

export function TabProduct({
  config,
  setConfig,
  appUrl,
  webhookCopied,
  onCopyWebhookUrl,
}: TabProductProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-6 shadow-xl space-y-5">
        <div className="border-b border-[#222e35] pb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span>Configurações do Produto & Entrega Segura</span>
          </h2>
          <p className="text-xs text-[#8696a0] mt-1">
            Defina o valor e a URL restrita de entrega liberada somente após o webhook de confirmação.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
              Nome Comercial do Produto
            </label>
            <input
              type="text"
              value={config.productName}
              onChange={(e) => setConfig({ ...config, productName: e.target.value })}
              placeholder="Método Alta Conversão"
              className="w-full px-4 py-2.5 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
              Preço (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={config.productPrice}
              onChange={(e) =>
                setConfig({ ...config, productPrice: parseFloat(e.target.value) || 0 })
              }
              placeholder="97.00"
              className="w-full px-4 py-2.5 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-sm text-white outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[#8696a0] mb-1.5 flex items-center justify-between">
              <span>Link Exclusivo de Entrega (Protegido)</span>
              <span className="text-[11px] text-amber-400 font-normal">
                NUNCA exposto à IA antes da confirmação do webhook
              </span>
            </label>
            <input
              type="url"
              value={config.productDeliveryLink}
              onChange={(e) =>
                setConfig({ ...config, productDeliveryLink: e.target.value })
              }
              placeholder="https://seusite.com/download/acesso-vip"
              className="w-full px-4 py-2.5 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-sm text-white outline-none font-mono"
            />
          </div>

          {/* Mensagem Pós-Venda / Confirmação de Pagamento */}
          <div className="md:col-span-2 space-y-2.5 pt-3 border-t border-[#222e35]/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-semibold text-white">
                  Mensagem de Entrega / Pós-Pagamento (Enviada Automaticamente)
                </label>
                <p className="text-[11px] text-[#8696a0]">
                  Disparada pelo atendente no chat no exato momento da confirmação do pagamento via PIX.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    productDeliveryMessage: DEFAULT_DELIVERY_MESSAGE,
                  })
                }
                className="inline-flex items-center gap-1.5 text-[11px] text-[#8696a0] hover:text-emerald-400 transition-colors self-start sm:self-auto py-1"
                title="Restaurar mensagem padrão de entrega"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Mensagem Padrão</span>
              </button>
            </div>

            {/* Quick Insert Variable Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-[#8696a0]">Inserir Tags:</span>
              <button
                type="button"
                onClick={() => {
                  setConfig({
                    ...config,
                    productDeliveryMessage:
                      (config.productDeliveryMessage || DEFAULT_DELIVERY_MESSAGE) + " [CLIENTE]",
                  });
                }}
                className="px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono transition-colors"
                title="Nome do Cliente comprador"
              >
                + [CLIENTE]
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfig({
                    ...config,
                    productDeliveryMessage:
                      (config.productDeliveryMessage || DEFAULT_DELIVERY_MESSAGE) + " [LINK_ENTREGA]",
                  });
                }}
                className="px-2 py-0.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 text-[11px] font-mono transition-colors"
                title="Link de Acesso do Produto"
              >
                + [LINK_ENTREGA]
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfig({
                    ...config,
                    productDeliveryMessage:
                      (config.productDeliveryMessage || DEFAULT_DELIVERY_MESSAGE) + " [PRODUTO]",
                  });
                }}
                className="px-2 py-0.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 text-[11px] font-mono transition-colors"
                title="Nome Comercial do Produto"
              >
                + [PRODUTO]
              </button>
            </div>

            <textarea
              rows={6}
              value={config.productDeliveryMessage ?? DEFAULT_DELIVERY_MESSAGE}
              onChange={(e) =>
                setConfig({ ...config, productDeliveryMessage: e.target.value })
              }
              placeholder="Escreva a mensagem de entrega..."
              className="w-full px-4 py-3 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white outline-none custom-scrollbar leading-relaxed font-sans"
            />

            <div className="p-3 bg-[#182229] border border-[#26353d] rounded-xl text-[11px] text-[#8696a0] space-y-1">
              <p>
                • <code className="text-emerald-400 font-mono">[CLIENTE]</code>: Substituído automaticamente pelo nome do comprador.
              </p>
              <p>
                • <code className="text-teal-400 font-mono">[LINK_ENTREGA]</code>: Substituído pelo Link de Entrega configurado acima.
              </p>
              <p>
                • <code className="text-sky-400 font-mono">[PRODUTO]</code>: Substituído pelo nome comercial do produto.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
              Modo do Gateway de Pagamento
            </label>
            <select
              value={config.paymentGateway}
              onChange={(e) => setConfig({ ...config, paymentGateway: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-sm text-white outline-none"
            >
              <option value="simulated">Simulador Sandbox (Teste Imediato)</option>
              <option value="mercadopago">Mercado Pago</option>
              <option value="asaas">Asaas</option>
              <option value="stripe">Stripe / Webhook Genérico</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
              Token / Chave de API do Gateway
            </label>
            <input
              type="password"
              value={config.paymentGatewayToken}
              onChange={(e) =>
                setConfig({ ...config, paymentGatewayToken: e.target.value })
              }
              placeholder="APP_USR-..."
              className="w-full px-4 py-2.5 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-sm text-white outline-none font-mono"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#222e35]">
          <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
            URL de Notificação do Webhook (Copie para seu Gateway)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={`${appUrl}/api/webhooks/payment`}
              className="w-full px-4 py-2.5 bg-[#182229] border border-[#222e35] rounded-xl text-xs text-emerald-400 font-mono outline-none"
            />
            <button
              type="button"
              onClick={onCopyWebhookUrl}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#202c33] hover:bg-[#26353d] border border-[#26353d] text-white rounded-xl text-xs font-medium transition-colors shrink-0"
            >
              {webhookCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar URL</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

