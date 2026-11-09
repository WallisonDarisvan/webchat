"use client";

import React from "react";
import { FileText, RefreshCw, Zap, Clock, Tag } from "lucide-react";
import { AdminConfig, AdminTabType } from "../types";
import { PromptTag, DEFAULT_SYSTEM_PROMPT } from "@/lib/config";

interface TabPromptProps {
  config: AdminConfig;
  setConfig: React.Dispatch<React.SetStateAction<AdminConfig>>;
  allTags: PromptTag[];
  onNavigateTab: (tab: AdminTabType) => void;
}

export function TabPrompt({
  config,
  setConfig,
  allTags,
  onNavigateTab,
}: TabPromptProps) {
  const insertTagIntoPrompt = (tagName: string) => {
    const textarea = document.getElementById("systemPromptTextarea") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const text = config.systemPrompt;
      const updated = text.substring(0, start) + tagName + text.substring(end);
      setConfig({ ...config, systemPrompt: updated });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tagName.length, start + tagName.length);
      }, 50);
    } else {
      setConfig({ ...config, systemPrompt: config.systemPrompt + " " + tagName });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#222e35] pb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span>System Prompt & Instruções de Humanização</span>
            </h2>
            <p className="text-xs text-[#8696a0] mt-1">
              Define a personalidade do atendente, regras anti-robô e o gatilho de checkout.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setConfig({ ...config, systemPrompt: DEFAULT_SYSTEM_PROMPT })}
            className="text-xs text-[#8696a0] hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Restaurar Padrão</span>
          </button>
        </div>

        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Gatilho de Pagamento Automático:</span>
          </p>
          <p className="text-emerald-200/80">
            Quando o cliente concordar em pagar ou pedir a compra, a IA emitirá a tag{" "}
            <code className="bg-emerald-950 px-1.5 py-0.5 rounded text-white font-mono">
              [GERAR_PAGAMENTO]
            </code>
            . O backend captura essa tag, remove do texto visível e monta o card com QR Code PIX imediatamente.
          </p>
        </div>

        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <label className="block text-xs font-semibold text-white">
                Prompt de Sistema Completo
              </label>
              <p className="text-[11px] text-[#8696a0]">
                Clique nas tags abaixo para inseri-las diretamente no texto do prompt.
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {allTags
                .filter((t) => t.type === "variable")
                .map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => insertTagIntoPrompt(tag.name)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs hover:bg-emerald-500/25 transition-colors cursor-pointer"
                    title={`Inserir ${tag.name}: ${tag.description}`}
                  >
                    <span>+ {tag.name}</span>
                  </button>
                ))}

              <button
                type="button"
                onClick={() => onNavigateTab("timer")}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#202c33] border border-[#26353d] text-[#8696a0] hover:text-white font-mono text-xs hover:border-[#3b4a54] transition-colors cursor-pointer ml-1"
                title="Configurar limites de tempo e timers"
              >
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>Configurar Timers</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab("tags")}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#202c33] border border-[#26353d] text-[#8696a0] hover:text-white font-mono text-xs hover:border-[#3b4a54] transition-colors cursor-pointer"
                title="Gerenciar ou criar novas tags na aba de Tags"
              >
                <Tag className="w-3 h-3 text-emerald-400" />
                <span>Gerenciar Tags</span>
              </button>
            </div>
          </div>

          <textarea
            id="systemPromptTextarea"
            rows={16}
            value={config.systemPrompt}
            onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
            className="w-full px-4 py-3 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white font-mono leading-relaxed outline-none resize-y"
          />
        </div>
      </div>
    </div>
  );
}
