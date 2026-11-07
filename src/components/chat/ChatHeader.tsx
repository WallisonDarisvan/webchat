"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Settings, RefreshCw } from "lucide-react";

interface ChatHeaderProps {
  userName?: string;
  isOnline?: boolean;
  onReset?: () => void;
}

export function ChatHeader({ userName, isOnline = true, onReset }: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-[#111b21] border-b border-[#222e35] shadow-md">
      <div className="flex items-center gap-3">
        {/* Attendant Avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md">
            <div className="w-full h-full rounded-full bg-[#111b21] flex items-center justify-center font-bold text-emerald-400 text-sm">
              GS
            </div>
          </div>
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#111b21] rounded-full" />
          )}
        </div>

        {/* Attendant info */}
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-semibold text-white tracking-tight">Gabriel Siqueira</h1>
            <span className="inline-flex items-center text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded font-medium border border-emerald-500/20">
              Verificado
            </span>
          </div>
          <p className="text-xs text-[#8696a0] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Consultor Oficial • Responde em instantes</span>
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2">
        {userName && (
          <span className="hidden sm:inline-block text-xs bg-[#202c33] text-[#8696a0] px-2.5 py-1 rounded-full border border-[#222e35]">
            Atendendo: <strong className="text-white font-medium">{userName}</strong>
          </span>
        )}

        {onReset && (
          <button
            onClick={onReset}
            title="Nova conversa"
            className="p-2 text-[#8696a0] hover:text-white hover:bg-[#202c33] rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        <Link
          href="/admin"
          title="Painel Administrativo"
          className="p-2 text-[#8696a0] hover:text-white hover:bg-[#202c33] rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
}

