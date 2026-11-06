/**
 * Real-time connection. Uses socket.io-client against VITE_SOCKET_URL,
 * authenticated with the JWT. In mock mode a local event bus stands in.
 */
import { io } from "socket.io-client";
import { SOCKET_URL, USE_MOCK } from "./config";
import { subscribeMockEvents } from "./mock/bus";
import type { SocketEventPayload } from "./types";

export const SOCKET_EVENTS = [
  "donation:new",
  "donation:claimed",
  "donation:collected",
  "donation:cancelled",
  "ngo:verified",
  "ngo:rejected",
  "ngo:registered",
] as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[number];
type Handler = (payload: SocketEventPayload) => void;

export interface AppSocket {
  on(event: SocketEvent, handler: Handler): void;
  off(event: SocketEvent, handler: Handler): void;
  disconnect(): void;
}

class MockSocket implements AppSocket {
  private handlers = new Map<string, Set<Handler>>();
  private unsubscribe: () => void;

  constructor(private userId: string) {
    this.unsubscribe = subscribeMockEvents((msg) => {
      if (!msg.targetUserIds.includes(this.userId)) return;
      this.handlers.get(msg.event)?.forEach((h) => h(msg.payload));
    });
  }
  on(event: SocketEvent, handler: Handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
  }
  off(event: SocketEvent, handler: Handler) {
    this.handlers.get(event)?.delete(handler);
  }
  disconnect() {
    this.unsubscribe();
    this.handlers.clear();
  }
}

export function connectSocket(token: string, userId: string): AppSocket {
  if (USE_MOCK) return new MockSocket(userId);
  const socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
  });
  return {
    on: (e, h) => socket.on(e, h),
    off: (e, h) => socket.off(e, h),
    disconnect: () => socket.disconnect(),
  };
}
