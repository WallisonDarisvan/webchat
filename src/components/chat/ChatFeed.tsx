"use client";

import React, { useEffect, useRef } from "react";
import { Lock } from "lucide-react";
import { ChatBubble, MessageData } from "./ChatBubble";
import { TypingIndicator } from "./TypingIndicator";

interface ChatFeedProps {
  messages: MessageData[];
  isTyping: boolean;
  onSimulatePayment?: (orderId: string) => void;
}

export function ChatFeed({ messages, isTyping, onSimulatePayment }: ChatFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages or typing state change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 chat-wallpaper">
      {/* Security Banner */}
      <div className="flex justify-center my-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#182229]/90 border border-[#222e35] rounded-lg text-center text-xs text-[#8696a0] max-w-sm shadow-sm">
          <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>As mensagens são protegidas e o atendimento é em tempo real.</span>
        </div>
      </div>

      {/* Date Pill */}
      <div className="flex justify-center my-3">
        <span className="px-3 py-1 bg-[#182229] border border-[#222e35] rounded-md text-[11px] font-medium text-[#8696a0] shadow-sm uppercase tracking-wider">
          Hoje
        </span>
      </div>

      {/* Messages */}
      {messages.map((message) => (
        <ChatBubble
          key={message.id}
          message={message}
          onSimulatePayment={onSimulatePayment}
        />
      ))}

      {/* Typing Indicator */}
      {isTyping && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}

