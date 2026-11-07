"use client";

import React from "react";

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 my-2 animate-in fade-in duration-200">
      {/* Small attendant avatar */}
      <div className="w-7 h-7 rounded-full bg-emerald-700/40 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-300 shrink-0">
        GS
      </div>

      <div className="flex flex-col">
        <span className="text-[11px] text-[#8696a0] ml-1 mb-1 font-medium">
          Gabriel está digitando...
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

