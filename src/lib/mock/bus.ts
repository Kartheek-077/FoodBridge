/**
 * In-browser stand-in for the Socket.IO server used in mock mode.
 * Events are delivered to listeners in this tab and, via BroadcastChannel,
 * to other open tabs (so a donor tab and an NGO tab can see each other live).
 */
import type { SocketEventPayload } from "../types";

export interface MockSocketMessage {
  event: string;
  targetUserIds: string[];
  payload: SocketEventPayload;
}

type Listener = (msg: MockSocketMessage) => void;

const listeners = new Set<Listener>();
let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  if (!channel) {
    channel = new BroadcastChannel("foodbridge-mock-socket");
    channel.onmessage = (e: MessageEvent<MockSocketMessage>) => {
      listeners.forEach((l) => l(e.data));
    };
  }
  return channel;
}

export function emitMockEvent(msg: MockSocketMessage) {
  // Deliver asynchronously, like a real network push.
  setTimeout(() => listeners.forEach((l) => l(msg)), 50);
  try {
    getChannel()?.postMessage(msg);
  } catch {
    /* ignore cross-tab delivery failures */
  }
}

export function subscribeMockEvents(listener: Listener): () => void {
  getChannel();
  listeners.add(listener);
  return () => listeners.delete(listener);
}
