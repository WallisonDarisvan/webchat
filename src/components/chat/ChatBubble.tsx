"use client";

import React from "react";
import { CheckCheck, ExternalLink } from "lucide-react";
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
}

export function ChatBubble({ message, onSimulatePayment }: ChatBubbleProps) {
  const isUser = message.sender === "user";
  const isSystem = message.sender === "system";

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

  // Render text and detect links
  const renderFormattedContent = (content: string) => {
    // URL detector regex
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
        <div className="w-7 h-7 rounded-full bg-emerald-700/40 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-300 shrink-0 mb-1">
          GS
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
        <div className="whitespace-pre-wrap break-words">
          {renderFormattedContent(message.content)}
        </div>

        {/* Timestamp and status check */}
        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#8696a0]/80 float-right ml-3 -mb-1">
          <span>{time}</span>
          {isUser && <CheckCheck className="w-3.5 h-3.5 text-emerald-400 inline" />}
        </div>
      </div>
    </div>
  );
}

