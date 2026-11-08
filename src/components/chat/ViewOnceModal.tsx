"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, EyeOff, ShieldCheck, ShieldAlert } from "lucide-react";

interface ViewOnceModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export function ViewOnceModal({ isOpen, imageUrl, onClose }: ViewOnceModalProps) {
  const [isBlackout, setIsBlackout] = useState(false);
  const [securityTriggered, setSecurityTriggered] = useState(false);
  const hasClosedRef = useRef(false);

  // Safe close ensuring expiration is only fired once
  const triggerSafeClose = (reason?: string) => {
    if (hasClosedRef.current) return;
    hasClosedRef.current = true;
    setIsBlackout(true);
    if (reason) setSecurityTriggered(true);

    // Wipe clipboard if printscreen was attempted
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText("");
      }
    } catch {}

    setTimeout(() => {
      onClose();
    }, 400);
  };

  useEffect(() => {
    if (!isOpen) {
      setIsBlackout(false);
      setSecurityTriggered(false);
      hasClosedRef.current = false;
      return;
    }

    // 1. Interceptar a tecla PrintScreen e atalhos de cópia/salvar/impressão
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes naturally
      if (e.key === "Escape") {
        triggerSafeClose();
        return;
      }

      // PrintScreen key
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        triggerSafeClose("Captura de tela detectada");
        return;
      }

      // Ctrl/Cmd + (S: salvar, P: imprimir, C: copiar, Shift+S / Windows Snip)
      if (
        (e.ctrlKey || e.metaKey) &&
        ["s", "p", "c", "u"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerSafeClose("Comando não permitido");
        return;
      }

      // F12 or Inspect shortcuts
      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        triggerSafeClose("Inspetor detectado");
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault();
        triggerSafeClose("Captura de tela detectada");
      }
    };

    // 2 & 3. Tela preta instantânea e fechar se a aba/janela perder o foco (blur, visibilitychange, pagehide)
    const handleBlur = () => {
      // Quando o usuário tenta printar no celular ou desktop, o navegador perde o foco
      triggerSafeClose("Perda de foco detectada");
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerSafeClose("Janela oculta");
      }
    };

    const handlePageHide = () => {
      triggerSafeClose("Navegação detectada");
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [isOpen]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col select-none transition-colors duration-150 ${
        isBlackout ? "bg-black" : "bg-black/95 backdrop-blur-md"
      }`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{
        WebkitTouchCallout: "none", // 4. Bloqueio de menu nativo do celular (iOS Safari)
        WebkitUserSelect: "none",
        userSelect: "none",
        touchAction: "pan-y",
      }}
    >
      {/* Top Bar */}
      <header className="px-4 py-3.5 flex items-center justify-between border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full border border-dashed border-emerald-400 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
            1
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
              <span>Foto de visualização única</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-normal border border-amber-500/30">
                Expira ao fechar
              </span>
            </h3>
            <p className="text-[11px] text-[#8696a0] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Protegida contra capturas e salvamento</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => triggerSafeClose()}
          className="p-2 text-[#8696a0] hover:text-white hover:bg-white/10 rounded-full transition-colors flex items-center gap-1 text-xs"
          title="Fechar e expirar foto"
        >
          <X className="w-5 h-5" />
          <span className="hidden sm:inline">Fechar</span>
        </button>
      </header>

      {/* Photo Viewer with instant blackout layer */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
        {/* Instant Blackout Protection Layer */}
        {isBlackout ? (
          <div className="absolute inset-0 bg-black z-30 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-75">
            <ShieldAlert className="w-10 h-10 text-amber-400 mb-2" />
            <p className="text-sm font-semibold text-white">Visualização Expirada</p>
            <p className="text-xs text-[#8696a0] mt-1 max-w-xs">
              {securityTriggered
                ? "Tentativa de captura ou troca de janela detectada. A foto foi expirada por segurança."
                : "A foto foi fechada e não pode mais ser acessada."}
            </p>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt="Foto de visualização única"
            className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl pointer-events-none transition-all duration-100"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            style={{
              WebkitTouchCallout: "none", // 4. Bloqueio de menu nativo no iOS/Android
              WebkitUserSelect: "none",
              userSelect: "none",
            }}
          />
        )}
      </div>

      {/* Footer warning */}
      <footer className="p-3 text-center border-t border-white/10 bg-black/40">
        <p className="text-xs text-[#8696a0] flex items-center justify-center gap-1.5">
          <EyeOff className="w-3.5 h-3.5 text-amber-400" />
          <span>Ao sair da tela, perder foco ou tentar capturar, a foto expira imediatamente.</span>
        </p>
      </footer>
    </div>
  );
}
