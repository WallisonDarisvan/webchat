"use client";

import React from "react";
import { Plus } from "lucide-react";

interface NewAttendantModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  setName: (val: string) => void;
  slug: string;
  setSlug: (val: string) => void;
  isCreating: boolean;
  onSubmit: (e: React.FormEvent) => void;
  appUrl: string;
}

export function NewAttendantModal({
  isOpen,
  onClose,
  name,
  setName,
  slug,
  setSlug,
  isCreating,
  onSubmit,
  appUrl,
}: NewAttendantModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#222e35] pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            <span>Cadastrar Novo Atendente</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8696a0] hover:text-white text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Nome do Atendente *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                const val = e.target.value;
                setName(val);
                setSlug(
                  val
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "")
                );
              }}
              placeholder="Ex: Amanda Castro"
              className="w-full px-3.5 py-2.5 bg-[#202c33] border border-[#26353d] focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Slug da URL (Link)
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2.5 bg-[#182229] border border-r-0 border-[#26353d] rounded-l-xl text-xs text-[#8696a0] font-mono">
                {"/"}
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_-]/g, "-")
                  )
                }
                placeholder="amanda"
                className="w-full px-3 py-2.5 bg-[#202c33] border border-[#26353d] focus:border-emerald-500 rounded-r-xl text-xs sm:text-sm text-white font-mono outline-none"
              />
            </div>
            <p className="text-[11px] text-[#8696a0] mt-1">
              O link de vendas será:{" "}
              <span className="text-emerald-400 font-mono">
                {`${appUrl}/${slug || "nome"}`}
              </span>
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#202c33] hover:bg-[#2a3942] text-white text-xs font-medium rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-md shadow-emerald-950 disabled:opacity-50"
            >
              {isCreating ? "Criando..." : "Criar Atendente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

