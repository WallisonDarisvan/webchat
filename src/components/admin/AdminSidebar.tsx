"use client";

import React from "react";
import { Users, Plus, Trash2 } from "lucide-react";

interface AdminSidebarProps {
  attendantsList: any[];
  selectedAttendantId: string;
  onSelectAttendant: (id: string) => void;
  onOpenNewModal: () => void;
  onDeleteAttendant: () => void;
}

export function AdminSidebar({
  attendantsList,
  selectedAttendantId,
  onSelectAttendant,
  onOpenNewModal,
  onDeleteAttendant,
}: AdminSidebarProps) {
  return (
    <aside className="w-full md:w-64 lg:w-72 bg-[#111b21] border-b md:border-b-0 md:border-r border-[#222e35] flex flex-col shrink-0 h-full overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-[#222e35] flex items-center justify-between bg-[#111b21]">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Atendentes
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20">
            {attendantsList.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenNewModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-colors shadow-sm shadow-emerald-950"
          title="Cadastrar Novo Atendente"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo</span>
        </button>
      </div>

      {/* Attendants List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
        {attendantsList.map((attendant) => {
          const isSelected = attendant.id === selectedAttendantId;
          return (
            <button
              key={attendant.id}
              type="button"
              onClick={() => onSelectAttendant(attendant.id)}
              className={`w-full text-left p-3 rounded-2xl transition-all flex items-center gap-3 border ${
                isSelected
                  ? "bg-[#182229] border-emerald-500/50 shadow-md shadow-emerald-950/30"
                  : "bg-transparent hover:bg-[#182229]/60 border-transparent hover:border-[#222e35]"
              }`}
            >
              <div className="relative shrink-0">
                {attendant.avatar ? (
                  <img
                    src={attendant.avatar}
                    alt={attendant.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-[#222e35]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#202c33] text-emerald-400 flex items-center justify-center font-bold text-sm ring-2 ring-[#222e35]">
                    {attendant.name.charAt(0)}
                  </div>
                )}
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#111b21] ${
                    attendant.isActive !== false ? "bg-emerald-500" : "bg-neutral-500"
                  }`}
                  title={attendant.isActive !== false ? "Online / Ativo" : "Oculto"}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className={`text-xs font-bold truncate ${
                    isSelected ? "text-white" : "text-[#d1d7db]"
                  }`}
                >
                  {attendant.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-[#8696a0] font-mono truncate">
                    /{attendant.slug}
                  </span>
                  {attendant.isActive === false && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-700/50 text-neutral-400">
                      Oculto
                    </span>
                  )}
                </div>
              </div>

              {isSelected && (
                <div className="w-1.5 h-7 rounded-full bg-emerald-500 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer: Delete Button */}
      {attendantsList.length > 1 && (
        <div className="p-3 border-t border-[#222e35] bg-[#0b141a]/40 flex items-center justify-between">
          <span className="text-[11px] text-[#8696a0]">Ações do perfil</span>
          <button
            type="button"
            onClick={onDeleteAttendant}
            className="text-red-400/80 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors inline-flex items-center gap-1 text-[11px]"
            title="Excluir este atendente"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir</span>
          </button>
        </div>
      )}
    </aside>
  );
}

