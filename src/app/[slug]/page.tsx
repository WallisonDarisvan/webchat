import React from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";

interface AttendantPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AttendantChatPage({ params }: AttendantPageProps) {
  const { slug } = await params;
  return <ChatContainer attendantSlug={slug} showBackButton={true} />;
}
