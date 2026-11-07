type EventCallback = (event: { type: string; payload: unknown }) => void;

class SessionEventManager {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  subscribe(sessionId: string, callback: EventCallback): () => void {
    if (!this.listeners.has(sessionId)) {
      this.listeners.set(sessionId, new Set());
    }

    const set = this.listeners.get(sessionId)!;
    set.add(callback);

    return () => {
      set.delete(callback);
      if (set.size === 0) {
        this.listeners.delete(sessionId);
      }
    };
  }

  broadcast(sessionId: string, type: string, payload: unknown) {
    const set = this.listeners.get(sessionId);
    if (!set || set.size === 0) return;

    for (const callback of set) {
      try {
        callback({ type, payload });
      } catch (err) {
        console.error("Error dispatching event to listener:", err);
      }
    }
  }
}

// Global singleton across serverless / hot reload
const globalForEvents = globalThis as unknown as {
  sessionEventManager: SessionEventManager | undefined;
};

export const sessionEvents =
  globalForEvents.sessionEventManager ?? new SessionEventManager();

if (process.env.NODE_ENV !== "production") {
  globalForEvents.sessionEventManager = sessionEvents;
}

