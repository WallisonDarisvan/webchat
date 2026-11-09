"use client";

import React from "react";
import {
  User,
  Bot,
  FileText,
  Clock,
  Tag,
  Image as ImageIcon,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { AdminTabType } from "./types";

interface AdminTabsNavProps {
  activeTab: AdminTabType;
  onSelectTab: (tab: AdminTabType) => void;
  totalTagsCount: number;
  mediaCount: number;
}

export function AdminTabsNav({
  activeTab,
  onSelectTab,
  totalTagsCount,
  mediaCount,
}: AdminTabsNavProps) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-[#222e35] pb-4 mb-6">
      <button
        onClick={() => onSelectTab("profile")}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
          activeTab === "profile"
            ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
            : "bg-[#182229] text-[#8696a0] hover:text-white hover:bg-[#202c33]"
        }`}
      >
        <User className="w-4 h-4" />
        <span>1. Perfil do Atendente</span>
      </button>

      <button
        onClick={() => onSelectTab("ai")}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
          activeTab === "ai"
            ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
            : "bg-[#182229] text-[#8696a0] hover:text-white hover:bg-[#202c33]"
        }`}
      >
        <Bot className="w-4 h-4" />
        <span>2. Provedor de IA</span>
      </button>

      <button
        onClick={() => onSelectTab("prompt")}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
          activeTab === "prompt"
            ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
            : "bg-[#182229] text-[#8696a0] hover:text-white hover:bg-[#202c33]"
        }`}
      >
        <FileText className="w-4 h-4" />
        <span>3. Comportamento & Prompt</span>
      </button>

      <button
        onClick={() => onSelectTab("timer")}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
          activeTab === "timer"
            ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
            : "bg-[#182229] text-[#8696a0] hover:text-white hover:bg-[#202c33]"
        }`}
      >
        <Clock className="w-4 h-4" />
        <span>4. Timer</span>
      </button>

      <button
        onClick={() => onSelectTab("tags")}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
          activeTab === "tags"
            ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
            : "bg-[#182229] text-[#8696a0] hover:text-white hover:bg-[#202c33]"
        }`}
      >
        <Tag className="w-4 h-4" />
        <span>5. Tags & Variáveis</span>
        {totalTagsCount > 0 && (
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-400/20 text-emerald-300 font-bold">
            {totalTagsCount}
          </span>
        )}
      </button>

      <button
        onClick={() => onSelectTab("media")}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
          activeTab === "media"
            ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
            : "bg-[#182229] text-[#8696a0] hover:text-white hover:bg-[#202c33]"
        }`}
      >
        <ImageIcon className="w-4 h-4" />
        <span>6. Mídias</span>
        {mediaCount > 0 && (
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-400/20 text-emerald-300 font-bold">
            {mediaCount}
          </span>
        )}
      </button>

      <button
        onClick={() => onSelectTab("product")}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
          activeTab === "product"
            ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
            : "bg-[#182229] text-[#8696a0] hover:text-white hover:bg-[#202c33]"
        }`}
      >
        <DollarSign className="w-4 h-4" />
        <span>7. Produto & Pagamento</span>
      </button>

      <button
        onClick={() => onSelectTab("stats")}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
          activeTab === "stats"
            ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
            : "bg-[#182229] text-[#8696a0] hover:text-white hover:bg-[#202c33]"
        }`}
      >
        <BarChart3 className="w-4 h-4" />
        <span>8. Vendas & Auditoria</span>
      </button>
    </div>
  );
}
