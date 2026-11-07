"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { VisitorModal } from "@/components/chat/VisitorModal";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatFeed } from "@/components/chat/ChatFeed";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageData } from "@/components/chat/ChatBubble";

const DEVICE_ID_KEY = "webchat_device_id";
const USER_NAME_KEY = "webchat_user_name";

export default function ChatPage() {
  const [deviceId, setDeviceId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoadingInit, setIsLoadingInit] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Initialize session on mount
  useEffect(() => {
    let storedDeviceId = localStorage.getItem(DEVICE_ID_KEY);
    const storedName = localStorage.getItem(USER_NAME_KEY);

    if (!storedDeviceId) {
      storedDeviceId = uuidv4();
      localStorage.setItem(DEVICE_ID_KEY, storedDeviceId);
      setDeviceId(storedDeviceId);

      // New visitor: open modal to ask name
      setIsModalOpen(true);
      setIsInitialized(true);
    } else {
      setDeviceId(storedDeviceId);
      if (storedName) {
        setUserName(storedName);
        // Returning visitor: directly init session without modal
        initSession(storedDeviceId, storedName);
      } else {
        setIsModalOpen(true);
        setIsInitialized(true);
      }
    }
  }, []);

  const initSession = async (devId: string, name?: string) => {
    setIsLoadingInit(true);
    try {
      const res = await fetch("/api/chat/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: devId, userName: name }),
      });

      if (!res.ok) throw new Error("Failed to init chat");

      const data = await res.json();
      setSessionId(data.session.id);
      setUserName(data.session.userName);
      setMessages(data.messages || []);
      setIsModalOpen(false);

      if (name) {
        localStorage.setItem(USER_NAME_KEY, name);
      }
    } catch (err) {
      console.error("Init session error:", err);
    } finally {
      setIsLoadingInit(false);
      setIsInitialized(true);
    }
  };

  const handleModalSubmit = (name: string) => {
    setUserName(name);
    initSession(deviceId, name);
  };

  // Connect to SSE stream whenever sessionId is available
  useEffect(() => {
    if (!sessionId) return;

    // Close any previous SSE
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sse = new EventSource(`/api/chat/events?sessionId=${sessionId}`);
    eventSourceRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);

        if (parsed.type === "new_message") {
          const newMsg = parsed.payload as MessageData;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;

            // If it's a user message, replace matching temp message to prevent duplicate bubble
            if (newMsg.sender === "user") {
              const tempIndex = prev.findIndex(
                (m) => m.sender === "user" && m.id.startsWith("temp-") && m.content === newMsg.content
              );
              if (tempIndex !== -1) {
                const updated = [...prev];
                updated[tempIndex] = newMsg;
                return updated;
              }
            }

            return [...prev, newMsg];
          });
        }

        if (parsed.type === "typing_status") {
          setIsTyping(Boolean(parsed.payload?.isTyping));
        }

        if (parsed.type === "order_paid") {
          const { orderId, message } = parsed.payload;

          // Update any payment card message status to "paid"
          setMessages((prev) =>
            prev.map((m) => {
              if (
                m.metadata?.type === "payment_card" &&
                (m.metadata.orderId === orderId || !orderId)
              ) {
                return {
                  ...m,
                  metadata: {
                    ...m.metadata,
                    status: "paid",
                  },
                };
              }
              return m;
            })
          );

          // Append delivery message if provided
          if (message) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === message.id)) return prev;
              return [...prev, message];
            });
          }
        }
      } catch (err) {
        console.error("Error parsing SSE event data:", err);
      }
    };

    sse.onerror = (err) => {
      console.warn("SSE connection interrupted, fallback polling will keep messages synced.", err);
    };

    return () => {
      sse.close();
    };
  }, [sessionId]);

  // Send message handler
  const handleSendMessage = async (text: string) => {
    if (!sessionId || !text.trim()) return;

    // Optimistic UI for user message
    const tempUserMsg: MessageData = {
      id: `temp-${Date.now()}`,
      sender: "user",
      content: text,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content: text }),
      });

      if (!res.ok) {
        throw new Error("Erro ao enviar mensagem");
      }

      const data = await res.json();

      // Replace temp user message with official one from DB
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
        const toAdd = [data.userMessage, ...(data.agentMessages || [])];
        if (data.paymentMessage) toAdd.push(data.paymentMessage);

        const merged = [...filtered];
        for (const item of toAdd) {
          if (!merged.some((m) => m.id === item.id)) {
            merged.push(item);
          }
        }
        return merged;
      });
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  // Simulate payment confirmation in Sandbox mode
  const handleSimulatePayment = async (orderId: string) => {
    try {
      const res = await fetch("/api/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: "paid" }),
      });

      if (!res.ok) throw new Error("Erro ao simular pagamento");

      // Mark local state as paid
      setMessages((prev) =>
        prev.map((m) => {
          if (m.metadata?.type === "payment_card" && m.metadata.orderId === orderId) {
            return {
              ...m,
              metadata: {
                ...m.metadata,
                status: "paid",
              },
            };
          }
          return m;
        })
      );
    } catch (err) {
      console.error("Error in handleSimulatePayment:", err);
    }
  };

  // Reset conversation handler
  const handleReset = () => {
    if (confirm("Deseja iniciar um novo atendimento com outro nome?")) {
      localStorage.removeItem(USER_NAME_KEY);
      const newDevId = uuidv4();
      localStorage.setItem(DEVICE_ID_KEY, newDevId);
      setDeviceId(newDevId);
      setUserName("");
      setSessionId("");
      setMessages([]);
      setIsModalOpen(true);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b141a]">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex justify-center min-h-screen bg-[#0b141a]">
      <main className="w-full max-w-2xl h-screen flex flex-col bg-[#111b21] shadow-2xl relative border-x border-[#222e35]/50">
        <ChatHeader
          userName={userName}
          isOnline={true}
          onReset={handleReset}
        />

        <ChatFeed
          messages={messages}
          isTyping={isTyping}
          onSimulatePayment={handleSimulatePayment}
        />

        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isTyping}
        />

        <VisitorModal
          isOpen={isModalOpen}
          onSubmit={handleModalSubmit}
          isLoading={isLoadingInit}
        />
      </main>
    </div>
  );
}

