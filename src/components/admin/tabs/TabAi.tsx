"use client";

import React from "react";
import { Bot, Eye, EyeOff, Sparkles } from "lucide-react";
import { AdminConfig } from "../types";

interface TabAiProps {
  config: AdminConfig;
  setConfig: React.Dispatch<React.SetStateAction<AdminConfig>>;
  showApiKey: boolean;
  setShowApiKey: (val: boolean) => void;
  aiTestResult: { success: boolean; message: string } | null;
  isTestingAi: boolean;
  onTestAi: () => void;
}

export function TabAi({
  config,
  setConfig,
  showApiKey,
  setShowApiKey,
  aiTestResult,
  isTestingAi,
  onTestAi,
}: TabAiProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-6 shadow-xl space-y-5">
        <div className="border-b border-[#222e35] pb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            <span>Configuração do Provedor de IA</span>
          </h2>
          <p className="text-xs text-[#8696a0] mt-1">
            Compatível com DeepSeek, OpenAI, OpenRouter ou qualquer endpoint compatível.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
              Endpoint Base URL
            </label>
            <input
              type="text"
              value={config.aiBaseUrl}
              onChange={(e) => setConfig({ ...config, aiBaseUrl: e.target.value })}
              placeholder="https://api.deepseek.com"
              className="w-full px-4 py-2.5 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-sm text-white outline-none"
            />
            <span className="text-[11px] text-[#8696a0] mt-1 block">
              Ex: <code className="text-emerald-400">https://api.deepseek.com</code> ou{" "}
              <code className="text-emerald-400">https://openrouter.ai/api/v1</code>
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
              Nome do Modelo
            </label>
            <input
              type="text"
              value={config.aiModel}
              onChange={(e) => setConfig({ ...config, aiModel: e.target.value })}
              placeholder="deepseek-chat"
              className="w-full px-4 py-2.5 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-sm text-white outline-none"
            />
            <span className="text-[11px] text-[#8696a0] mt-1 block">
              Ex: <code className="text-emerald-400">deepseek-chat</code>,{" "}
              <code className="text-emerald-400">gpt-4o-mini</code>
            </span>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
              Chave de API (API Key)
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={config.aiApiKey}
                onChange={(e) => setConfig({ ...config, aiApiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full px-4 py-2.5 pr-12 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-sm text-white outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8696a0] hover:text-white p-1"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-[#8696a0]">
                Temperatura: <strong className="text-white">{config.aiTemperature}</strong>
              </label>
              <span className="text-[11px] text-[#8696a0]">
                {config.aiTemperature <= 0.3
                  ? "Muito Preciso"
                  : config.aiTemperature <= 0.8
                  ? "Equilibrado (Recomendado para Vendas)"
                  : "Mais Criativo"}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={config.aiTemperature}
              onChange={(e) =>
                setConfig({ ...config, aiTemperature: parseFloat(e.target.value) })
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-[#222e35] flex items-center justify-between flex-wrap gap-3">
          <button
            type="button"
            onClick={onTestAi}
            disabled={isTestingAi || !config.aiApiKey}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#202c33] hover:bg-[#26353d] border border-[#26353d] text-white rounded-xl text-xs font-medium transition-colors disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isTestingAi ? "Testando conexão..." : "Testar Conexão com a IA"}</span>
          </button>

          {aiTestResult && (
            <span
              className={`text-xs px-3 py-1.5 rounded-lg border ${
                aiTestResult.success
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}
            >
              {aiTestResult.message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
