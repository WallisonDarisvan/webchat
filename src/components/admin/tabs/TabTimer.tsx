"use client";

import React from "react";
import { Clock, Plus, Zap, Tag, Check, Copy, Edit2, Trash2 } from "lucide-react";
import { AdminConfig, AdminTabType } from "../types";
import { PromptTag } from "@/lib/config";

interface TabTimerProps {
  config: AdminConfig;
  setConfig: React.Dispatch<React.SetStateAction<AdminConfig>>;
  customTagsList: PromptTag[];
  onOpenNewTagModal: (category?: "general" | "timer" | "action") => void;
  onOpenEditTagModal: (tag: PromptTag) => void;
  onDeleteTag: (tagId: string) => void;
  onCopyTagToken: (tagName: string, tagId: string) => void;
  copiedTagId: string | null;
  onNavigateTab: (tab: AdminTabType) => void;
}

export function TabTimer({
  config,
  setConfig,
  customTagsList,
  onOpenNewTagModal,
  onOpenEditTagModal,
  onDeleteTag,
  onCopyTagToken,
  copiedTagId,
  onNavigateTab,
}: TabTimerProps) {
  const customTimerTags = customTagsList.filter(
    (t) => t.category === "timer" || t.name.startsWith("[TEMPO")
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Card */}
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222e35] pb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span>Gerenciador de Timers & Ciclos de Conversa</span>
            </h2>
            <p className="text-xs text-[#8696a0] mt-1">
              Configure os limites de tempo da conversa, inatividade e bloqueio, além de criar tags de tempo personalizadas para a IA.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenNewTagModal("timer")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-all shadow-md shadow-emerald-950 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Novo Timer</span>
            </button>
          </div>
        </div>

        {/* Informative Banner */}
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>3 Gatilhos Inteligentes do Sistema:</span>
          </p>
          <p className="text-emerald-200/80 leading-relaxed">
            • <strong>Pós-Venda:</strong> Tempo que a atendente continua conversando carinhosamente após a aprovação do PIX antes de acionar a despedida.
            <br />
            • <strong>Inatividade:</strong> Se o cliente sumir sem responder durante este tempo, a IA aciona a despedida por inatividade. Conversas ativas nunca são cortadas!
            <br />
            • <strong>Bloqueio / Cooldown:</strong> Tempo que a atendente fica offline ("com o namorado") até poder voltar a falar no dia seguinte.
          </p>
        </div>

        {/* Core System Timers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-[#182229] border border-[#26353d] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white">
                Tempo Pós-Venda
              </label>
              <button
                type="button"
                onClick={() => onCopyTagToken("[TEMPO-POS-VENDA]", "core_pos_venda")}
                className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px] border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                title="Clique para copiar a tag"
              >
                <span>[TEMPO-POS-VENDA]</span>
                {copiedTagId === "core_pos_venda" ? (
                  <Check className="w-2.5 h-2.5 text-emerald-300 stroke-[3]" />
                ) : (
                  <Copy className="w-2.5 h-2.5" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={120}
                value={config.postPurchaseMinutes ?? 10}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    postPurchaseMinutes: parseInt(e.target.value) || 10,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#202c33] border border-[#26353d] focus:border-emerald-500 rounded-xl text-sm font-bold text-white outline-none"
              />
              <span className="text-xs text-[#8696a0]">minutos</span>
            </div>
            <p className="text-[11px] text-[#8696a0]">
              Tempo pós-PIX antes de acionar a desculpa do namorado.
            </p>
          </div>

          <div className="p-4 bg-[#182229] border border-[#26353d] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white">
                Tempo de Inatividade
              </label>
              <button
                type="button"
                onClick={() => onCopyTagToken("[TEMPO-INATIVIDADE]", "core_inatividade")}
                className="font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded text-[11px] border border-teal-500/30 hover:bg-teal-500/20 transition-colors flex items-center gap-1"
                title="Clique para copiar a tag"
              >
                <span>[TEMPO-INATIVIDADE]</span>
                {copiedTagId === "core_inatividade" ? (
                  <Check className="w-2.5 h-2.5 text-teal-300 stroke-[3]" />
                ) : (
                  <Copy className="w-2.5 h-2.5" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={120}
                value={config.nonPurchaseMinutes ?? 15}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    nonPurchaseMinutes: parseInt(e.target.value) || 15,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#202c33] border border-[#26353d] focus:border-emerald-500 rounded-xl text-sm font-bold text-white outline-none"
              />
              <span className="text-xs text-[#8696a0]">minutos</span>
            </div>
            <p className="text-[11px] text-[#8696a0]">
              Silêncio do cliente para acionar a despedida por inatividade.
            </p>
          </div>

          <div className="p-4 bg-[#182229] border border-[#26353d] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white">
                Bloqueio / Cooldown
              </label>
              <button
                type="button"
                onClick={() => onCopyTagToken("[TEMPO-COOLDOWN]", "core_cooldown")}
                className="font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded text-[11px] border border-sky-500/30 hover:bg-sky-500/20 transition-colors flex items-center gap-1"
                title="Clique para copiar a tag"
              >
                <span>[TEMPO-COOLDOWN]</span>
                {copiedTagId === "core_cooldown" ? (
                  <Check className="w-2.5 h-2.5 text-sky-300 stroke-[3]" />
                ) : (
                  <Copy className="w-2.5 h-2.5" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={72}
                value={config.cooldownHours ?? 24}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    cooldownHours: parseInt(e.target.value) || 24,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#202c33] border border-[#26353d] focus:border-emerald-500 rounded-xl text-sm font-bold text-white outline-none"
              />
              <span className="text-xs text-[#8696a0]">horas</span>
            </div>
            <p className="text-[11px] text-[#8696a0]">
              Horas que a atendente fica offline até poder voltar a falar.
            </p>
          </div>
        </div>
      </div>

      {/* Custom Timers Section */}
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#222e35] pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>Timers e Tags de Tempo Adicionais</span>
            </h3>
            <p className="text-xs text-[#8696a0] mt-0.5">
              Crie tags de tempo extras (ex: [TEMPO-OFERTA], [TEMPO-GARANTIA]) para serem usadas no prompt.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenNewTagModal("timer")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#202c33] hover:bg-[#26353d] text-white rounded-xl text-xs font-medium transition-colors border border-[#26353d]"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Criar Timer Extra</span>
          </button>
        </div>

        {customTimerTags.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8696a0] border border-dashed border-[#222e35] rounded-xl space-y-2">
            <Clock className="w-8 h-8 text-[#8696a0]/40 mx-auto" />
            <p className="text-[#e9edef] font-medium">Nenhum timer personalizado criado ainda.</p>
            <p className="text-[11px] text-[#8696a0] max-w-md mx-auto">
              Você pode criar timers como <code className="text-emerald-400 font-mono">[TEMPO-OFERTA]</code> ("15 minutos") ou <code className="text-emerald-400 font-mono">[TEMPO-GARANTIA]</code> ("7 dias") para usar no Prompt da IA.
            </p>
            <button
              type="button"
              onClick={() => onOpenNewTagModal("timer")}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Primeiro Timer Personalizado</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customTimerTags.map((tag) => (
              <div
                key={tag.id}
                className="p-4 bg-[#182229] border border-[#26353d] rounded-xl flex flex-col justify-between hover:border-emerald-500/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                      {tag.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 font-semibold">
                      Timer Personalizado
                    </span>
                  </div>

                  <p className="text-xs text-[#e9edef] mb-2">{tag.description}</p>

                  <div className="p-2 bg-[#202c33] rounded-lg border border-[#26353d] text-xs mb-3">
                    <span className="text-[10px] text-[#8696a0] block uppercase tracking-wider font-semibold">
                      Tempo Configurado:
                    </span>
                    <code className="text-xs text-white font-mono font-bold block">
                      {tag.value}
                    </code>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#222e35] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onCopyTagToken(tag.name, tag.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#202c33] hover:bg-[#26353d] text-white text-xs transition-colors"
                  >
                    {copiedTagId === tag.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                        <span className="text-emerald-400 text-xs">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-[#8696a0]" />
                        <span className="text-xs">Copiar</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenEditTagModal(tag)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#202c33] hover:bg-[#26353d] text-[#8696a0] hover:text-white text-xs transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteTag(tag.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sincronização Hint */}
        <div className="pt-3 border-t border-[#222e35] flex items-center justify-between text-xs text-[#8696a0]">
          <span>
            💡 Todas as tags criadas aqui também aparecem listadas na aba <strong>Tags & Variáveis</strong>.
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab("tags")}
            className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Ver todas as tags</span>
          </button>
        </div>
      </div>
    </div>
  );
}

