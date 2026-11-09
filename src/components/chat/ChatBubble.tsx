"use client";

import React, { useState } from "react";
import { CheckCheck, ExternalLink, Eye, EyeOff, Maximize2 } from "lucide-react";
import { PaymentCard } from "./PaymentCard";

export interface MessageData {
  id: string;
  sender: "user" | "agent" | "system";
  content: string;
  metadata?: any;
  createdAt: string | Date;
}

interface ChatBubbleProps {
  message: MessageData;
  onSimulatePayment?: (orderId: string) => void;
  onOpenViewOnce?: (messageId: string, imageUrl: string) => void;
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

export function ChatBubble({
  message,
  onSimulatePayment,
  onOpenViewOnce,
  agentName = "Gabriel Siqueira",
  agentAvatar,
}: ChatBubbleProps) {
  const isUser = message.sender === "user";
  const isSystem = message.sender === "system";
  const initials = getInitials(agentName);
  const [isBlurred, setIsBlurred] = useState(false);

  // Check if it's a payment card message
  if (isSystem && message.metadata?.type === "payment_card") {
    return (
      <div className="flex justify-center my-3 px-2">
        <PaymentCard
          orderId={message.metadata.orderId}
          amount={message.metadata.amount}
          pixCode={message.metadata.pixCode}
          pixQrCodeUrl={message.metadata.pixQrCodeUrl}
          status={message.metadata.status}
          onSimulatePayment={onSimulatePayment}
        />
      </div>
    );
  }

  // Format message time (HH:MM)
  const time = new Date(message.createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Extract attached image if present in metadata
  let imageUrl: string | null = null;
  if (message.metadata) {
    if (typeof message.metadata === "object" && message.metadata.imageUrl) {
      imageUrl = message.metadata.imageUrl;
    } else if (typeof message.metadata === "string") {
      try {
        const parsed = JSON.parse(message.metadata);
        if (parsed?.imageUrl) imageUrl = parsed.imageUrl;
      } catch {}
    }
  }

  // Do not show title text for agent media messages (render pure photo)
  const isAgentMedia =
    message.metadata?.type === "agent_media" ||
    (typeof message.metadata === "string" && message.metadata.includes('"type":"agent_media"'));
  const hasVisibleText = Boolean(message.content?.trim()) && !isAgentMedia;

  // View once status
  let isViewOnce = false;
  let isViewed = false;
  if (message.metadata) {
    try {
      const meta = typeof message.metadata === "object" ? message.metadata : JSON.parse(message.metadata);
      isViewOnce = Boolean(meta.viewOnce);
      isViewed = Boolean(meta.viewed);
    } catch {}
  }

  // Render text and detect links
  const renderFormattedContent = (content: string) => {
    if (!content) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 my-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold rounded-lg underline underline-offset-2 transition-colors break-all shadow-sm border border-emerald-500/30"
          >
            <span className="truncate max-w-[260px] sm:max-w-xs">{part}</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-1" />
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div
      className={`flex items-end gap-2 my-2 animate-in fade-in duration-200 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* Attendant avatar on the left for agent messages */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-emerald-700/40 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-300 shrink-0 mb-1 overflow-hidden">
          {agentAvatar ? (
            <img src={agentAvatar} alt={agentName} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] px-3.5 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
          isUser
            ? "bg-[#005c4b] text-white rounded-br-sm"
            : "bg-[#202c33] text-[#e9edef] rounded-bl-sm border border-[#26353d]"
        }`}
      >
        {/* Render View-Once WhatsApp pill */}
        {isViewOnce ? (
          <div className="py-0.5">
            {!isViewed ? (
              <button
                type="button"
                onClick={() => {
                  if (imageUrl && onOpenViewOnce) {
                    onOpenViewOnce(message.id, imageUrl);
                  }
                }}
                className="flex items-center gap-3 py-1.5 px-2.5 -mx-1 bg-[#182229]/60 hover:bg-[#26353d] border border-emerald-500/30 rounded-xl transition-all text-left group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-emerald-400 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform bg-emerald-500/10">
                  1
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <span>Foto</span>
                    <span className="text-[10px] text-emerald-300 font-normal px-1.5 py-0.2 rounded-full bg-emerald-500/20">
                      Abrir
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8696a0] block truncate">
                    Visualização única
                  </span>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-3 py-1.5 px-2.5 -mx-1 bg-[#182229]/40 border border-[#26353d]/50 rounded-xl select-none opacity-60">
                <div className="w-8 h-8 rounded-full border-2 border-solid border-[#8696a0]/50 text-[#8696a0] text-xs font-semibold flex items-center justify-center shrink-0 bg-[#202c33]">
                  1
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <div className="text-sm font-medium text-[#8696a0]">
                    Mensagem aberta
                  </div>
                  <span className="text-[11px] text-[#8696a0]/60 block truncate">
                    Foto expirada
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Render normal attached image if available */
          imageUrl && (
            <div
              className={`${
                hasVisibleText ? "mb-2" : ""
              } relative overflow-hidden rounded-xl bg-black/30 border border-black/20 group select-none`}
            >
              <img
                src={imageUrl}
                alt="Foto enviada"
                className={`max-h-72 w-full object-contain cursor-pointer transition-all duration-300 ${
                  isUser && isBlurred ? "blur-xl scale-105 brightness-75" : "blur-0 scale-100"
                } hover:opacity-95`}
                onClick={() => {
                  if (isUser) {
                    setIsBlurred((prev) => !prev);
                  } else {
                    window.open(imageUrl!, "_blank");
                  }
                }}
              />

              {/* User Photo Interaction: Blur / Focus Overlay & Action Indicators */}
              {isUser && (
                <>
                  {/* Blurred State Overlay */}
                  {isBlurred && (
                    <div
                      onClick={() => setIsBlurred(false)}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer transition-all p-3"
                    >
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 border border-white/20 text-white text-xs font-medium shadow-xl hover:bg-black/90 transition-all hover:scale-105">
                        <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Desfocada • Toque para focar</span>
                      </div>
                    </div>
                  )}

                  {/* Focused State subtle hint (visible on hover / discreet badge) */}
                  {!isBlurred && (
                    <div className="absolute top-2 right-2 pointer-events-none transition-opacity opacity-0 group-hover:opacity-100 sm:opacity-75">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] text-white/90 shadow">
                        <Eye className="w-3 h-3 text-emerald-400" />
                        <span>Toque para desfocar</span>
                      </span>
                    </div>
                  )}

                  {/* Open in full resolution button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(imageUrl!, "_blank");
                    }}
                    className="absolute top-2 left-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white backdrop-blur-sm border border-white/10 shadow transition-all opacity-0 group-hover:opacity-100 sm:opacity-75"
                    title="Abrir imagem em tela cheia"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          )
        )}

        {hasVisibleText && (
          <div className="whitespace-pre-wrap break-words">
            {renderFormattedContent(message.content)}
          </div>
        )}

        {/* Timestamp and status check */}
        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#8696a0]/80 float-right ml-3 -mb-1">
          <span>{time}</span>
          {isUser && <CheckCheck className="w-3.5 h-3.5 text-emerald-400 inline" />}
        </div>
      </div>
    </div>
  );
}
