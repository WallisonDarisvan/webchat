"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { VisitorModal } from "@/components/chat/VisitorModal";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatFeed } from "@/components/chat/ChatFeed";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageData } from "@/components/chat/ChatBubble";
import { ViewOnceModal } from "@/components/chat/ViewOnceModal";

const DEVICE_ID_KEY = "webchat_device_id";
const USER_NAME_KEY = "webchat_user_name";

export default function ChatPage() {
  const [deviceId, setDeviceId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [agentName, setAgentName] = useState<string>("Gabriel Siqueira");
  const [agentAvatar, setAgentAvatar] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoadingInit, setIsLoadingInit] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [viewOnceModal, setViewOnceModal] = useState<{
    isOpen: boolean;
    messageId: string | null;
    imageUrl: string | null;
  }>({
    isOpen: false,
    messageId: null,
    imageUrl: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  // Initialize session on mount
  useEffect(() => {
    // Fetch public agent info (name & avatar) immediately
    fetch("/api/chat/init")
      .then((res) => res.json())
      .then((data) => {
        if (data.agentName) setAgentName(data.agentName);
        if (data.agentAvatar) setAgentAvatar(data.agentAvatar);
      })
      .catch(() => {});

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
      if (data.agentName) {
        setAgentName(data.agentName);
      }
      if (data.agentAvatar) {
        setAgentAvatar(data.agentAvatar);
      }
      if (typeof data.isOnline !== "undefined") {
        setIsOnline(Boolean(data.isOnline));
      }
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

        if (parsed.type === "agent_status") {
          setIsOnline(Boolean(parsed.payload?.isOnline));
        }

        if (parsed.type === "message_updated") {
          const { id, metadata } = parsed.payload;
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, metadata } : m))
          );
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
  const handleSendMessage = async (payload: { text: string; image?: string }) => {
    if (payload.text.trim().toLowerCase() === "/reset") {
      handleReset();
      return;
    }

    if (!sessionId || (!payload.text.trim() && !payload.image)) return;

    // Optimistic UI for user message
    const tempUserMsg: MessageData = {
      id: `temp-${Date.now()}`,
      sender: "user",
      content: payload.text,
      metadata: payload.image ? { imageUrl: payload.image } : null,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          content: payload.text,
          image: payload.image,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        // Rollback optimistic message if rejected by server
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        if (errorData?.error) {
          alert(errorData.error);
        }
        return;
      }

      const data = await res.json();

      // Replace temp user message with official one from DB
      if (data.userMessage) {
        setMessages((prev) => {
          const index = prev.findIndex((m) => m.id === tempUserMsg.id);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = data.userMessage;
            return updated;
          }
          if (!prev.some((m) => m.id === data.userMessage.id)) {
            return [...prev, data.userMessage];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Send message error:", err);
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
  const handleReset = useCallback(() => {
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
  }, []);

  // Shortcut: CTRL + ALT + R to reset conversation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.code === "KeyR" || e.key === "r" || e.key === "R")) {
        e.preventDefault();
        e.stopPropagation();
        handleReset();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleReset]);

  // Open view-once photo modal
  const handleOpenViewOnce = (messageId: string, imageUrl: string) => {
    setViewOnceModal({
      isOpen: true,
      messageId,
      imageUrl,
    });
  };

  // Close view-once photo modal and expire photo permanently
  const handleCloseViewOnce = async () => {
    const { messageId } = viewOnceModal;
    setViewOnceModal({ isOpen: false, messageId: null, imageUrl: null });

    if (messageId && sessionId) {
      // Mark as viewed locally immediately
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId) {
            const meta = typeof m.metadata === "object" ? { ...m.metadata } : JSON.parse(m.metadata || "{}");
            return {
              ...m,
              metadata: {
                ...meta,
                viewed: true,
                viewedAt: new Date().toISOString(),
                imageUrl: null, // Expire and wipe from local state
              },
            };
          }
          return m;
        })
      );

      // Persist to backend
      try {
        await fetch("/api/chat/media-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId, sessionId }),
        });
      } catch (err) {
        console.error("Error marking media as viewed:", err);
      }
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
          agentName={agentName}
          agentAvatar={agentAvatar}
          isOnline={isOnline}
          onReset={handleReset}
        />

        <ChatFeed
          messages={messages}
          isTyping={isTyping}
          agentName={agentName}
          agentAvatar={agentAvatar}
          onSimulatePayment={handleSimulatePayment}
          onOpenViewOnce={handleOpenViewOnce}
        />

        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={false}
          userPhotoCount={
            messages.filter((m) => m.sender === "user" && Boolean(m.metadata?.imageUrl)).length
          }
          maxPhotos={10}
        />

        <VisitorModal
          isOpen={isModalOpen}
          onSubmit={handleModalSubmit}
          isLoading={isLoadingInit}
          agentAvatar={agentAvatar}
          agentName={agentName}
        />

        <ViewOnceModal
          isOpen={viewOnceModal.isOpen}
          imageUrl={viewOnceModal.imageUrl}
          onClose={handleCloseViewOnce}
        />
      </main>
    </div>
  );
}

