"use client";

import React from "react";
import { ExternalLink, Copy } from "lucide-react";
import { AdminConfig } from "./types";

interface AttendantBannerProps {
  config: AdminConfig;
  appUrl: string;
}

export function AttendantBanner({ config, appUrl }: AttendantBannerProps) {
  return (
    <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="relative">
          {config.agentAvatar ? (
            <img
              src={config.agentAvatar}
              alt={config.agentName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/50 shadow-md"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#202c33] flex items-center justify-center text-emerald-400 font-bold text-sm ring-2 ring-emerald-500/40">
              {(config.agentName || "A").charAt(0)}
            </div>
          )}
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#111b21] ${
              config.isActive !== false ? "bg-emerald-500" : "bg-neutral-500"
            }`}
            title={config.isActive !== false ? "Atendente Ativo no Lobby" : "Atendente Oculto do Lobby"}
          />
        </div>

        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>{config.agentName}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#202c33] text-emerald-400 border border-[#26353d]">
              /{config.slug || "gabriel"}
            </span>
          </h2>
          <div className="flex items-center gap-2 text-xs text-[#8696a0] mt-0.5">
            <span>Link de Vendas:</span>
            <a
              href={`${appUrl}/${config.slug || "gabriel"}`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-mono inline-flex items-center gap-1"
            >
              <span>{`${appUrl}/${config.slug || "gabriel"}`}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`${appUrl}/${config.slug || "gabriel"}`);
                alert("Link do atendente copiado!");
              }}
              className="p-1 hover:text-white"
              title="Copiar link"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
            config.isActive !== false
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              config.isActive !== false ? "bg-emerald-400 animate-pulse" : "bg-neutral-400"
            }`}
          />
          <span>{config.isActive !== false ? "Visível na Página Inicial" : "Oculto da Página Inicial"}</span>
        </span>
      </div>
    </div>
  );
}
