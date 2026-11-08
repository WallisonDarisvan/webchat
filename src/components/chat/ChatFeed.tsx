"use client";

import React, { useEffect, useRef } from "react";
import { Lock } from "lucide-react";
import { ChatBubble, MessageData } from "./ChatBubble";
import { TypingIndicator } from "./TypingIndicator";

interface ChatFeedProps {
  messages: MessageData[];
  isTyping: boolean;
  onSimulatePayment?: (orderId: string) => void;
  onOpenViewOnce?: (messageId: string, imageUrl: string) => void;
  agentName?: string;
  agentAvatar?: string;
}

export function ChatFeed({
  messages,
  isTyping,
  onSimulatePayment,
  onOpenViewOnce,
  agentName,
  agentAvatar,
}: ChatFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages or typing state change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 chat-wallpaper custom-scrollbar">
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

      {/* Messages with duplicate defense */}
      {messages
        .filter((message, index, arr) => {
          if (index > 0) {
            const prev = arr[index - 1];
            if (
              message.sender === "user" &&
              prev.sender === "user" &&
              message.content.trim() === prev.content.trim()
            ) {
              return false;
            }
          }
          return true;
        })
        .map((message) => (
          <ChatBubble
            key={message.id}
            message={message}
            onSimulatePayment={onSimulatePayment}
            onOpenViewOnce={onOpenViewOnce}
            agentName={agentName}
            agentAvatar={agentAvatar}
          />
        ))}

      {/* Typing Indicator */}
      {isTyping && <TypingIndicator agentName={agentName} agentAvatar={agentAvatar} />}

      <div ref={bottomRef} />
    </div>
  );
}

