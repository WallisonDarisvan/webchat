"use client";

import React, { useState, useMemo } from "react";
import { FileText, RefreshCw, Zap, Clock, Tag, Eye, Edit3, Sparkles } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");

  // Identify all tags present in the prompt with their occurrences
  const detectedTags = useMemo(() => {
    const matches = config.systemPrompt.match(/\[[A-Z0-9_\-:]+\]/g) || [];
    const counts: Record<string, number> = {};
    matches.forEach((t) => {
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([tag, count]) => ({ tag, count }));
  }, [config.systemPrompt]);

  const insertTagIntoPrompt = (tagName: string) => {
    if (viewMode === "preview") {
      setViewMode("edit");
    }
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

  const getTagBadgeStyle = (tag: string) => {
    if (tag.startsWith("[TEMPO-")) {
      return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    }
    if (tag.startsWith("[ENVIAR_MIDIA")) {
      return "bg-purple-500/20 text-purple-300 border-purple-500/40";
    }
    if (
      tag === "[CLIENTE]" ||
      tag === "[ATENDENTE]" ||
      tag === "[PRODUTO]" ||
      tag === "[PRECO]" ||
      tag === "[PIX]" ||
      tag === "[LINK_ENTREGA]"
    ) {
      return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
    }
    if (
      tag === "[GERAR_PAGAMENTO]" ||
      tag === "[ENCERRAR_CONVERSA]" ||
      tag === "[FINALIZAR_CONVERSA]"
    ) {
      return "bg-emerald-500/25 text-emerald-300 border-emerald-500/50 font-semibold";
    }
    return "bg-sky-500/20 text-sky-300 border-sky-500/30";
  };

  const renderHighlightedText = (text: string) => {
    const parts = text.split(/(\[[A-Z0-9_\-:]+\])/g);
    return parts.map((part, index) => {
      if (/^\[[A-Z0-9_\-:]+\]$/.test(part)) {
        return (
          <span
            key={index}
            className={`inline-block px-1.5 py-0.5 mx-0.5 rounded border font-mono font-bold text-xs ${getTagBadgeStyle(
              part
            )}`}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
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

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="block text-xs font-semibold text-white">
                Prompt de Sistema Completo
              </label>
              <p className="text-[11px] text-[#8696a0]">
                Clique nas tags abaixo para inseri-las ou alterne para o modo de destaque visual.
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* View / Edit Mode Switcher */}
              <div className="flex items-center bg-[#172228] p-0.5 rounded-lg border border-[#222e35] mr-1">
                <button
                  type="button"
                  onClick={() => setViewMode("edit")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    viewMode === "edit"
                      ? "bg-emerald-500 text-black font-semibold shadow-sm"
                      : "text-[#8696a0] hover:text-white"
                  }`}
                  title="Modo de edição do texto"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("preview")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    viewMode === "preview"
                      ? "bg-emerald-500 text-black font-semibold shadow-sm"
                      : "text-[#8696a0] hover:text-white"
                  }`}
                  title="Visualizar prompt com todas as tags destacadas"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Destaque de Tags</span>
                </button>
              </div>

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

          {/* Real-time Detected Tags Bar */}
          <div className="p-3 bg-[#172228] border border-[#222e35] rounded-xl flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#8696a0] font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Tags identificadas no prompt ({detectedTags.reduce((acc, t) => acc + t.count, 0)}):
                </span>
              </span>
              {detectedTags.length === 0 ? (
                <span className="text-xs text-[#53656f] italic">Nenhuma tag no texto</span>
              ) : (
                detectedTags.map(({ tag, count }) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-mono text-[11px] ${getTagBadgeStyle(
                      tag
                    )}`}
                  >
                    <span>{tag}</span>
                    {count > 1 && <span className="opacity-70 text-[10px]">×{count}</span>}
                  </span>
                ))
              )}
            </div>

            {viewMode === "preview" && (
              <button
                type="button"
                onClick={() => setViewMode("edit")}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>Alternar para edição</span>
              </button>
            )}
          </div>

          {/* Editor or Highlighted View */}
          {viewMode === "edit" ? (
            <textarea
              id="systemPromptTextarea"
              rows={16}
              value={config.systemPrompt}
              onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
              className="w-full px-4 py-3 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white font-mono leading-relaxed outline-none resize-y"
              placeholder="Digite o System Prompt e utilize tags como [CLIENTE], [PRODUTO], [GERAR_PAGAMENTO]..."
            />
          ) : (
            <div
              onClick={() => setViewMode("edit")}
              title="Clique em qualquer lugar para editar o prompt"
              className="w-full min-h-[380px] max-h-[550px] overflow-y-auto px-4 py-3 bg-[#202c33] border border-emerald-500/40 rounded-xl text-xs sm:text-sm text-gray-200 font-mono leading-relaxed whitespace-pre-wrap select-text cursor-text shadow-inner"
            >
              {renderHighlightedText(config.systemPrompt)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

