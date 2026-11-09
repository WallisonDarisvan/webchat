"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Check, Save, LogOut } from "lucide-react";

interface AdminHeaderProps {
  isSaving: boolean;
  saveSuccess: boolean;
  onSave: () => void;
  onLogout: () => void;
}

export function AdminHeader({
  isSaving,
  saveSuccess,
  onSave,
  onLogout,
}: AdminHeaderProps) {
  return (
    <header className="shrink-0 z-30 bg-[#111b21] border-b border-[#222e35] px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="p-2 text-[#8696a0] hover:text-white hover:bg-[#202c33] rounded-lg transition-colors"
          title="Ir para o Chat"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span>Webchat Sales Admin</span>
            <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              Produção
            </span>
          </h1>
          <p className="text-xs text-[#8696a0]">
            Gerenciamento de IA, Mídias, Vendas e Gatilhos
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-all shadow-md shadow-emerald-950 disabled:opacity-50"
        >
          {saveSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Salvo com Sucesso!</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Salvando..." : "Salvar Alterações"}</span>
            </>
          )}
        </button>

        <button
          onClick={onLogout}
          title="Sair"
          className="p-2 text-[#8696a0] hover:text-red-400 hover:bg-[#202c33] rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
