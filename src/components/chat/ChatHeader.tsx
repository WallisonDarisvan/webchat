"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

interface ChatHeaderProps {
  userName?: string;
  agentName?: string;
  agentAvatar?: string;
  isOnline?: boolean;
  onReset?: () => void;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "GS";
}

export function ChatHeader({
  userName,
  agentName = "Gabriel Siqueira",
  agentAvatar,
  isOnline = true,
  onReset,
}: ChatHeaderProps) {
  const initials = getInitials(agentName);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-[#111b21] border-b border-[#222e35] shadow-md">
      <div className="flex items-center gap-3">
        {/* Attendant Avatar */}
        <div className="relative">
          <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md">
            <div className="w-full h-full rounded-full bg-[#111b21] flex items-center justify-center font-bold text-emerald-400 text-sm overflow-hidden">
              {agentAvatar ? (
                <img src={agentAvatar} alt={agentName} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
          </div>
          <span
            className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-[#111b21] rounded-full ${isOnline ? "bg-emerald-500" : "bg-gray-500"
              }`}
          />
        </div>

        {/* Attendant info */}
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {agentName}
            </h1>
          </div>
          <p className="text-xs text-[#8696a0] flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-gray-500"
                }`}
            />
            <span>
              {isOnline ? "Online • Responde em instantes" : "Offline • Volta mais tarde"}
            </span>
          </p>
        </div>
      </div>
    </header>
  );
}

