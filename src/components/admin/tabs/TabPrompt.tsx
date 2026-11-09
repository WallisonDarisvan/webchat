"use client";

import React, { useState, useRef, useEffect } from "react";
import { FileText, RefreshCw, Clock, Tag, Eye, EyeOff } from "lucide-react";
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
  const [highlightEnabled, setHighlightEnabled] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Synchronize scroll between textarea and the backdrop highlighting layer
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.currentTarget.scrollTop;
      backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Keep backdrop scroll in sync on external updates or text changes
  useEffect(() => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, [config.systemPrompt]);

  const insertTagIntoPrompt = (tagName: string) => {
    const textarea = textareaRef.current || (document.getElementById("systemPromptTextarea") as HTMLTextAreaElement);
    if (textarea) {
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const text = config.systemPrompt;
      const updated = text.substring(0, start) + tagName + text.substring(end);
      setConfig({ ...config, systemPrompt: updated });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tagName.length, start + tagName.length);
        if (backdropRef.current) {
          backdropRef.current.scrollTop = textarea.scrollTop;
        }
      }, 50);
    } else {
      setConfig({ ...config, systemPrompt: config.systemPrompt + " " + tagName });
    }
  };

  // Helper to categorize tag and get appropriate badge theme
  const getTagStyle = (tag: string) => {
    const upper = tag.toUpperCase();
    if (upper.includes("STATUS_CLIENTE") || upper.includes("STATUS")) {
      return {
        badgeClasses: "bg-purple-500/25 text-purple-300 ring-1 ring-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.25)]",
        type: "Status",
      };
    }
    if (
      upper.includes("TEMPO") ||
      upper.includes("TIMER") ||
      upper.includes("COOLDOWN") ||
      upper.includes("INATIVIDADE")
    ) {
      return {
        badgeClasses: "bg-cyan-500/25 text-cyan-300 ring-1 ring-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.25)]",
        type: "Timer",
      };
    }
    if (
      upper.includes("GERAR_PAGAMENTO") ||
      upper.includes("ENCERRAR") ||
      upper.includes("FINALIZAR") ||
      upper.includes("ENVIAR_MIDIA") ||
      upper.includes("DISPARAR")
    ) {
      return {
        badgeClasses: "bg-amber-500/25 text-amber-300 ring-1 ring-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.25)]",
        type: "Ação",
      };
    }
    return {
      badgeClasses: "bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.25)]",
      type: "Variável",
    };
  };

  // Renders the highlighted backdrop text with tags distinctly badged
  const renderHighlightedContent = (text: string) => {
    if (!text) return null;
    const TAG_REGEX = /(\[[A-Za-z0-9_\-:]+(?:\s+[A-Za-z0-9_\-:]+)*\])/g;
    const parts = text.split(TAG_REGEX);

    return parts.map((part, index) => {
      if (TAG_REGEX.test(part)) {
        const { badgeClasses } = getTagStyle(part);
        return (
          <span
            key={index}
            className={`font-semibold rounded px-1 -mx-0.5 inline ${badgeClasses}`}
          >
            {part}
          </span>
        );
      }

      return (
        <span key={index} className="text-[#e9edef]">
          {part}
        </span>
      );
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
            className="text-xs text-[#8696a0] hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Restaurar Padrão</span>
          </button>
        </div>

        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <label className="block text-xs font-semibold text-white">
                Prompt de Sistema Completo
              </label>
              <p className="text-[11px] text-[#8696a0] mt-0.5">
                Clique nas tags abaixo para inseri-las diretamente no texto do prompt.
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {allTags
                .filter(
                  (t) =>
                    t.type === "variable" &&
                    t.category !== "timer" &&
                    (t as any).category !== "status" &&
                    !t.name.startsWith("[STATUS_CLIENTE") &&
                    !t.name.startsWith("[TEMPO")
                )
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

              <button
                type="button"
                onClick={() => setHighlightEnabled(!highlightEnabled)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  highlightEnabled
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
                    : "bg-[#202c33] border-[#26353d] text-[#8696a0] hover:text-white"
                }`}
                title={highlightEnabled ? "Desativar destaque visual de tags" : "Ativar destaque visual de tags"}
              >
                {highlightEnabled ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Destaque Ativo</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-[#8696a0]" />
                    <span>Destaque Desativado</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Prompt Editor with Live Tag Syntax Highlighting */}
          <div className="relative w-full rounded-xl border border-[#222e35] focus-within:border-emerald-500 bg-[#202c33] overflow-hidden shadow-inner">
            {highlightEnabled && (
              <div
                ref={backdropRef}
                className="absolute inset-0 p-4 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words pointer-events-none select-none overflow-y-scroll text-transparent [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-transparent"
                aria-hidden="true"
              >
                {renderHighlightedContent(
                  config.systemPrompt.endsWith("\n")
                    ? config.systemPrompt + " "
                    : config.systemPrompt
                )}
              </div>
            )}

            <textarea
              ref={textareaRef}
              id="systemPromptTextarea"
              rows={18}
              value={config.systemPrompt}
              onChange={(e) => {
                setConfig({ ...config, systemPrompt: e.target.value });
                if (backdropRef.current) {
                  backdropRef.current.scrollTop = e.target.scrollTop;
                }
              }}
              onScroll={handleScroll}
              className={`w-full p-4 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words outline-none resize-y min-h-[420px] transition-colors relative z-10 ${
                highlightEnabled
                  ? "bg-transparent text-transparent caret-emerald-400 selection:bg-emerald-500/35 selection:text-white"
                  : "bg-transparent text-[#e9edef] caret-emerald-400 selection:bg-emerald-500/30 selection:text-white"
              }`}
              placeholder="Digite aqui as instruções e prompt de sistema..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

