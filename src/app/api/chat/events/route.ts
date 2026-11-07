import { NextRequest } from "next/server";
import { sessionEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return new Response("Missing sessionId parameter", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection ACK
      const initialAck = encoder.encode(
        `data: ${JSON.stringify({ type: "connected", payload: { sessionId } })}\n\n`
      );
      controller.enqueue(initialAck);

      // Subscribe to session events
      const unsubscribe = sessionEvents.subscribe(sessionId, (event) => {
        try {
          const chunk = encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
          controller.enqueue(chunk);
        } catch (err) {
          console.error("Error pushing event to SSE stream:", err);
        }
      });

      // Keepalive heartbeat every 20s to prevent reverse proxy/Cloudflare timeouts
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 20000);

      // Clean up on client disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disables proxy buffering in Nginx
    },
  });
}

