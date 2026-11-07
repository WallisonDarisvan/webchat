"use client";

import React, { useState } from "react";
import { MessageSquare, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

interface VisitorModalProps {
  isOpen: boolean;
  onSubmit: (name: string) => void;
  isLoading: boolean;
}

export function VisitorModal({ isOpen, onSubmit, isLoading }: VisitorModalProps) {
  const [name, setName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#111b21] border border-[#222e35] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 text-center relative">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Attendant Avatar with pulsing badge */}
        <div className="relative mx-auto w-20 h-20 mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-950/50">
            <div className="w-full h-full rounded-full bg-[#111b21] flex items-center justify-center overflow-hidden">
              <span className="text-2xl font-bold text-emerald-400">GS</span>
            </div>
          </div>
          <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-[#111b21] rounded-full animate-pulse" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Atendimento Prioritário Online</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight mb-2">
          Olá! Como posso te chamar?
        </h2>

        <p className="text-sm text-[#8696a0] mb-6 leading-relaxed">
          Para que nosso consultor possa tirar suas dúvidas com total atenção, digite seu primeiro nome abaixo.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Digite seu nome aqui..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
              autoFocus
              className="w-full px-4 py-3.5 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-white placeholder-[#8696a0] text-sm outline-none transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl transition-all duration-200 shadow-lg shadow-emerald-900/30"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Iniciar Atendimento Agora</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#8696a0]">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Conexão criptografada e segura</span>
        </div>
      </div>
    </div>
  );
}

