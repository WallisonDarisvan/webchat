"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Image as ImageIcon, X, Sparkles } from "lucide-react";
import { optimizeImageForVision } from "@/lib/image-optimizer";

export interface SendMessagePayload {
  text: string;
  image?: string;
}

interface ChatInputProps {
  onSendMessage: (payload: SendMessagePayload) => void;
  disabled?: boolean;
  userPhotoCount?: number;
  maxPhotos?: number;
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  userPhotoCount = 0,
  maxPhotos = 10,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState<{
    dataUrl: string;
    sizeKb: number;
  } | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const isPhotoLimitReached = userPhotoCount >= maxPhotos;

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);

  // Focus input when ready
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isPhotoLimitReached) {
      alert(`Você atingiu o limite máximo de ${maxPhotos} fotos enviadas para este atendimento.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsOptimizing(true);
    try {
      const optimized = await optimizeImageForVision(file);
      setSelectedImage({
        dataUrl: optimized.dataUrl,
        sizeKb: optimized.sizeKb,
      });
    } catch (err) {
      console.error("Falha ao otimizar imagem:", err);
      alert("Não foi possível processar a imagem selecionada.");
    } finally {
      setIsOptimizing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const message = text.trim();
    const hasImage = Boolean(selectedImage);

    if ((!message && !hasImage) || disabled || isSubmittingRef.current || isOptimizing) return;

    isSubmittingRef.current = true;
    const payload: SendMessagePayload = {
      text: message,
      image: selectedImage?.dataUrl,
    };

    setText("");
    setSelectedImage(null);
    onSendMessage(payload);

    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 100);
  };

  const canSend = (text.trim().length > 0 || selectedImage !== null) && !disabled && !isOptimizing;

  return (
    <footer className="sticky bottom-0 z-20 px-3 py-3 sm:px-4 bg-[#111b21] border-t border-[#222e35]">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        {/* Selected Image Preview Pill */}
        {selectedImage && (
          <div className="flex items-center gap-3 p-2 bg-[#202c33] border border-emerald-500/40 rounded-xl max-w-sm animate-in slide-in-from-bottom-2 duration-200">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-black/40 border border-[#26353d] shrink-0">
              <img
                src={selectedImage.dataUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Foto Otimizada</span>
              </div>
              <span className="text-[11px] text-[#8696a0] block truncate">
                {selectedImage.sizeKb} KB • Pronto para leitura da IA
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="p-1 text-[#8696a0] hover:text-red-400 hover:bg-[#111b21] rounded-lg transition-colors mr-1"
              title="Remover foto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Hidden Image File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Photo attach button */}
          <button
            type="button"
            onClick={() => {
              if (isPhotoLimitReached) {
                alert(`Você já atingiu o limite de ${maxPhotos} fotos enviadas neste atendimento.`);
                return;
              }
              fileInputRef.current?.click();
            }}
            disabled={disabled || isOptimizing || isPhotoLimitReached}
            className={`p-3 rounded-full transition-colors shrink-0 ${
              isPhotoLimitReached
                ? "text-[#8696a0]/30 cursor-not-allowed"
                : "text-[#8696a0] hover:text-emerald-400 hover:bg-[#202c33]"
            }`}
            title={
              isPhotoLimitReached
                ? `Limite de ${maxPhotos} fotos atingido`
                : userPhotoCount > 0
                ? `Enviar Foto ou Comprovante (${userPhotoCount}/${maxPhotos})`
                : "Enviar Foto ou Comprovante"
            }
          >
            {isOptimizing ? (
              <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            ) : (
              <div className="relative">
                <ImageIcon className="w-5 h-5" />
                {userPhotoCount > 0 && userPhotoCount < maxPhotos && (
                  <span className="absolute -top-1 -right-2 text-[9px] font-bold bg-[#202c33] border border-[#222e35] text-emerald-400 px-1 rounded-full leading-tight">
                    {userPhotoCount}
                  </span>
                )}
              </div>
            )}
          </button>

          <div className="relative flex-1 flex items-center bg-[#202c33] rounded-2xl border border-[#222e35] focus-within:border-emerald-500 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={disabled}
              placeholder={
                selectedImage
                  ? "Adicione uma legenda ou envie apenas a foto..."
                  : "Digite sua mensagem..."
              }
              className="w-full py-3.5 px-4 bg-transparent text-white placeholder-[#8696a0] text-sm outline-none disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={!canSend}
            className={`p-3.5 rounded-full transition-all duration-200 flex items-center justify-center shrink-0 ${
              canSend
                ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-950 scale-100"
                : "bg-[#202c33] text-[#8696a0] cursor-not-allowed opacity-60"
            }`}
            title="Enviar Mensagem"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </footer>
  );
}
