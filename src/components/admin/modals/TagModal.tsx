"use client";

import React from "react";
import { Tag, X } from "lucide-react";
import { PromptTag } from "@/lib/config";

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTag: PromptTag | null;
  tagNameInput: string;
  setTagNameInput: (val: string) => void;
  tagDescInput: string;
  setTagDescInput: (val: string) => void;
  tagValueInput: string;
  setTagValueInput: (val: string) => void;
  tagTypeInput: "variable" | "action";
  setTagTypeInput: (val: "variable" | "action") => void;
  onSave: (e?: React.FormEvent) => void;
}

export function TagModal({
  isOpen,
  onClose,
  editingTag,
  tagNameInput,
  setTagNameInput,
  tagDescInput,
  setTagDescInput,
  tagValueInput,
  setTagValueInput,
  tagTypeInput,
  setTagTypeInput,
  onSave,
}: TagModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-[#222e35] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              {editingTag ? `Editar Tag: ${editingTag.name}` : "Criar Nova Tag"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#8696a0] hover:text-white rounded-lg hover:bg-[#202c33] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              Nome da Tag / Token
            </label>
            <input
              type="text"
              value={tagNameInput}
              onChange={(e) => setTagNameInput(e.target.value)}
              placeholder="Ex: [CHAVE_PIX] ou CHAVE_PIX"
              required
              className="w-full px-4 py-2.5 bg-[#202c33] border border-[#26353d] focus:border-emerald-500 rounded-xl text-sm text-white font-mono outline-none"
            />
            <p className="text-[11px] text-[#8696a0] mt-1">
              Os colchetes <code className="text-emerald-400 font-mono">[ ]</code> serão adicionados automaticamente se você não colocar.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              Tipo da Tag
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTagTypeInput("variable")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  tagTypeInput === "variable"
                    ? "bg-emerald-500/10 border-emerald-500 text-white"
                    : "bg-[#202c33] border-[#26353d] text-[#8696a0] hover:border-[#3b4a54]"
                }`}
              >
                <span className="text-xs font-bold block text-white">Variável de Texto</span>
                <span className="text-[11px] text-[#8696a0] mt-0.5 block">
                  Substitui texto no prompt pelo valor configurado
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTagTypeInput("action")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  tagTypeInput === "action"
                    ? "bg-purple-500/10 border-purple-500 text-white"
                    : "bg-[#202c33] border-[#26353d] text-[#8696a0] hover:border-[#3b4a54]"
                }`}
              >
                <span className="text-xs font-bold block text-white">Ação / Informativa</span>
                <span className="text-[11px] text-[#8696a0] mt-0.5 block">
                  Gatilho ou diretriz de comportamento para a IA
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              Descrição / Finalidade
            </label>
            <input
              type="text"
              value={tagDescInput}
              onChange={(e) => setTagDescInput(e.target.value)}
              placeholder="Ex: Chave PIX do atendente para envio manual ou instrução"
              required
              className="w-full px-4 py-2.5 bg-[#202c33] border border-[#26353d] focus:border-emerald-500 rounded-xl text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              Valor / Texto de Substituição no Prompt
            </label>
            <textarea
              rows={3}
              value={tagValueInput}
              onChange={(e) => setTagValueInput(e.target.value)}
              placeholder="Ex: pix@empresa.com ou Qualquer texto que a tag deve injetar no prompt"
              className="w-full px-4 py-2.5 bg-[#202c33] border border-[#26353d] focus:border-emerald-500 rounded-xl text-sm text-white font-mono outline-none resize-none"
            />
            <p className="text-[11px] text-[#8696a0] mt-1">
              Sempre que esta tag aparecer no System Prompt, ela será trocada por este texto antes de consultar a IA.
            </p>
          </div>

          <div className="pt-3 border-t border-[#222e35] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#202c33] hover:bg-[#26353d] text-[#8696a0] hover:text-white rounded-xl text-xs font-medium transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-all shadow-md shadow-emerald-950"
            >
              {editingTag ? "Salvar Alterações" : "Criar Tag"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

