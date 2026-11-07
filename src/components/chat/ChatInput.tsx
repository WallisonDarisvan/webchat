"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Smile } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when attendant stops typing
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <footer className="sticky bottom-0 z-20 px-3 py-3 sm:px-4 bg-[#111b21] border-t border-[#222e35]">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-4xl mx-auto">
        <div className="relative flex-1 flex items-center bg-[#202c33] rounded-2xl border border-[#222e35] focus-within:border-emerald-500 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              disabled ? "Gabriel está digitando uma resposta..." : "Digite sua mensagem..."
            }
            className="w-full py-3.5 pl-4 pr-10 bg-transparent text-white placeholder-[#8696a0] text-sm outline-none disabled:opacity-50"
          />

          <button
            type="button"
            className="absolute right-3 text-[#8696a0] hover:text-[#e9edef] transition-colors p-1"
            title="Emojis"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className={`p-3.5 rounded-full transition-all duration-200 flex items-center justify-center ${
            text.trim() && !disabled
              ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-950 scale-100"
              : "bg-[#202c33] text-[#8696a0] cursor-not-allowed opacity-60"
          }`}
          title="Enviar Mensagem"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </footer>
  );
}

