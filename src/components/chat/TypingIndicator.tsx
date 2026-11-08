"use client";

import React from "react";

interface TypingIndicatorProps {
  agentName?: string;
  agentAvatar?: string;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "GS";
}

function getFirstName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts[0] || "Atendente";
}

export function TypingIndicator({
  agentName = "Gabriel Siqueira",
  agentAvatar,
}: TypingIndicatorProps) {
  const initials = getInitials(agentName);
  const firstName = getFirstName(agentName);

  return (
    <div className="flex items-end gap-2 my-2 animate-in fade-in duration-200">
      {/* Small attendant avatar */}
      <div className="w-7 h-7 rounded-full bg-emerald-700/40 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-300 shrink-0 overflow-hidden">
        {agentAvatar ? (
          <img src={agentAvatar} alt={agentName} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>

      <div className="flex flex-col">
        <span className="text-[11px] text-[#8696a0] ml-1 mb-1 font-medium">
          {firstName} está digitando...
        </span>
        <div className="inline-flex items-center gap-1.5 px-4 py-3 bg-[#202c33] rounded-2xl rounded-bl-sm border border-[#26353d] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 typing-dot-1" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 typing-dot-2" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 typing-dot-3" />
        </div>
      </div>
    </div>
  );
}

