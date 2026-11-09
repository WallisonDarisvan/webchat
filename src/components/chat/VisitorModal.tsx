"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";

interface VisitorModalProps {
  isOpen: boolean;
  onSubmit: (name: string) => void;
  isLoading: boolean;
  agentAvatar?: string;
  agentName?: string;
}

export function VisitorModal({
  isOpen,
  onSubmit,
  isLoading,
  agentAvatar,
  agentName = "Gabriel Siqueira",
}: VisitorModalProps) {
  const [name, setName] = useState("");
  const [imgRatio, setImgRatio] = useState<string>("3 / 4");
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect mobile virtual keyboard via VisualViewport API
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const vv = window.visualViewport;
    const handleViewportChange = () => {
      if (!vv) return;
      const heightDifference = window.innerHeight - vv.height;
      setIsKeyboardOpen(heightDifference > 120);
    };

    vv.addEventListener("resize", handleViewportChange);
    vv.addEventListener("scroll", handleViewportChange);

    return () => {
      vv.removeEventListener("resize", handleViewportChange);
      vv.removeEventListener("scroll", handleViewportChange);
    };
  }, []);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
  };

  const initials = agentName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "GS";

  const isKeyboardActive = isKeyboardOpen || isFocused;

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md transition-all duration-300 ${
        isKeyboardActive ? "items-end pb-3" : "items-center"
      }`}
    >
      <div
        className={`w-full max-w-sm bg-[#111b21] border border-[#222e35] rounded-2xl shadow-2xl overflow-hidden text-center relative max-h-[95dvh] flex flex-col overflow-y-auto transition-all duration-300 ${
          isKeyboardActive ? "scale-[0.98] sm:scale-100" : ""
        }`}
      >
        {/* Capa com altura proporcional e recolhimento inteligente quando o teclado abre */}
        <div
          className="relative w-full overflow-hidden bg-[#182229] shrink-0 transition-all duration-300 ease-out"
          style={{
            aspectRatio: isKeyboardActive ? undefined : imgRatio,
            maxHeight: isKeyboardActive ? "16vh" : "56vh",
            height: isKeyboardActive ? "16vh" : undefined,
          }}
        >
          {agentAvatar ? (
            <img
              src={agentAvatar}
              alt={agentName}
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight) {
                  setImgRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
                }
              }}
              className="w-full h-full object-cover object-top transition-all duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-emerald-950 via-[#182229] to-[#111b21] flex items-center justify-center min-h-[120px]">
              <span className="text-4xl font-bold text-emerald-400/40">{initials}</span>
            </div>
          )}

          {/* Gradiente suave na parte inferior da capa para fundir com o card */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111b21] via-[#111b21]/20 to-black/10 pointer-events-none" />

          {/* Badge Online discreta */}
          <div className="absolute top-3 right-3 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-emerald-400 text-[11px] font-medium shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online agora
            </span>
          </div>
        </div>

        {/* Formulário posicionado com prioridade acima do teclado */}
        <div className="pt-3 pb-4 px-5 sm:px-6 space-y-2.5 transition-all duration-300">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
              Como posso te chamar?
            </h2>
            <p className="text-xs text-[#8696a0] mt-0.5">
              Digite seu primeiro nome para iniciar a conversa.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5 pt-1">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Digite seu nome..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => {
                  setIsFocused(true);
                  setTimeout(() => {
                    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 120);
                }}
                onBlur={() => {
                  setIsFocused(false);
                }}
                disabled={isLoading}
                required
                autoFocus
                className="w-full px-3.5 py-2.5 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-white placeholder-[#8696a0] text-xs sm:text-sm outline-none transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-xs sm:text-sm rounded-xl transition-all duration-200 shadow-md shadow-emerald-950 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Iniciar Conversa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8696a0] pt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Atendimento em tempo real</span>
          </div>
        </div>
      </div>
    </div>
  );
}

