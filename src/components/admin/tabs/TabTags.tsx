"use client";

import React from "react";
import { Tag, Plus, Zap, Search, X, Check, Copy, Edit2, Trash2 } from "lucide-react";
import { PromptTag } from "@/lib/config";

interface TabTagsProps {
  systemTags: PromptTag[];
  customTagsList: PromptTag[];
  tagSearchQuery: string;
  setTagSearchQuery: (val: string) => void;
  onOpenNewTagModal: (category?: "general" | "timer" | "action") => void;
  onOpenEditTagModal: (tag: PromptTag) => void;
  onDeleteTag: (tagId: string) => void;
  onCopyTagToken: (tagName: string, tagId: string) => void;
  copiedTagId: string | null;
  getTagDisplayValue: (tag: PromptTag) => string;
}

export function TabTags({
  systemTags,
  customTagsList,
  tagSearchQuery,
  setTagSearchQuery,
  onOpenNewTagModal,
  onOpenEditTagModal,
  onDeleteTag,
  onCopyTagToken,
  copiedTagId,
  getTagDisplayValue,
}: TabTagsProps) {
  const allTags = [...systemTags, ...customTagsList];

  const filteredTags = allTags.filter((t) => {
    if (!tagSearchQuery.trim()) return true;
    const q = tagSearchQuery.toLowerCase();
    const displayVal = getTagDisplayValue(t).toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.value.toLowerCase().includes(q) ||
      displayVal.includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Card */}
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222e35] pb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-400" />
              <span>Gerenciador de Tags & Variáveis</span>
            </h2>
            <p className="text-xs text-[#8696a0] mt-1">
              Crie, edite ou exclua tags para enriquecer os prompts do sistema e acionar automações da IA.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenNewTagModal("general")}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-all shadow-md shadow-emerald-950 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Nova Tag</span>
          </button>
        </div>

        {/* Informative Banner */}
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Como funcionam as Tags:</span>
          </p>
          <p className="text-emerald-200/80 leading-relaxed">
            • <strong>Variáveis de Texto:</strong> Ao inserir tags como{" "}
            <code className="bg-emerald-950 px-1.5 py-0.5 rounded text-white font-mono">[NOME]</code>,{" "}
            <code className="bg-emerald-950 px-1.5 py-0.5 rounded text-white font-mono">[TEMPO-POS-VENDA]</code>{" "}
            ou qualquer tag criada por você no Prompt de Sistema, ela é substituída dinamicamente pelo valor cadastrado antes de enviar à IA.
            <br />
            • <strong>Tags de Ação / Gatilhos:</strong> Tags como{" "}
            <code className="bg-emerald-950 px-1.5 py-0.5 rounded text-white font-mono">[GERAR_PAGAMENTO]</code> ou{" "}
            <code className="bg-emerald-950 px-1.5 py-0.5 rounded text-white font-mono">[ENCERRAR_CONVERSA]</code>{" "}
            são comandos de controle emitidos pela IA para disparar ações do sistema.
          </p>
        </div>

        {/* Search & Counts */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8696a0] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tagSearchQuery}
              onChange={(e) => setTagSearchQuery(e.target.value)}
              placeholder="Buscar tags por nome, descrição ou valor..."
              className="w-full pl-10 pr-9 py-2 bg-[#202c33] border border-[#26353d] focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white outline-none"
            />
            {tagSearchQuery && (
              <button
                type="button"
                onClick={() => setTagSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8696a0] hover:text-white"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#8696a0]">
            <span>
              Total: <strong className="text-white">{allTags.length}</strong> tags ({systemTags.length} nativas, {customTagsList.length} personalizadas)
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTags.map((tag) => (
          <div
            key={tag.id}
            className="p-5 bg-[#111b21] border border-[#222e35] rounded-2xl shadow-lg flex flex-col justify-between hover:border-[#26353d] transition-all group"
          >
            <div>
              {/* Top Header of Tag Card */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    {tag.name}
                  </span>
                  {tag.isSystem ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 font-semibold">
                      Nativa do Sistema
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 font-semibold">
                      Personalizada
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                    tag.type === "action"
                      ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                      : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  }`}
                >
                  {tag.type === "action" ? "Gatilho de Ação" : "Variável de Texto"}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-[#e9edef] leading-relaxed mb-3">
                {tag.description}
              </p>

              {/* Value box */}
              <div className="p-2.5 bg-[#182229] border border-[#26353d] rounded-xl text-xs space-y-1 mb-4">
                <span className="text-[10px] text-[#8696a0] block uppercase tracking-wider font-semibold">
                  {tag.type === "action" ? "Comportamento da Ação:" : "Substituição no Prompt:"}
                </span>
                <code className="text-xs text-white font-mono break-all block">
                  {getTagDisplayValue(tag) || "—"}
                </code>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-[#222e35] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onCopyTagToken(tag.name, tag.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202c33] hover:bg-[#26353d] text-white text-xs font-medium transition-colors"
                title="Copiar token da tag"
              >
                {copiedTagId === tag.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#8696a0]" />
                    <span>Copiar Tag</span>
                  </>
                )}
              </button>

              {!tag.isSystem ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenEditTagModal(tag)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#202c33] hover:bg-[#26353d] text-[#8696a0] hover:text-white text-xs transition-colors"
                    title="Editar tag"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteTag(tag.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors"
                    title="Excluir tag"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-[#8696a0]/60 italic">
                  Protegida pelo sistema
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

