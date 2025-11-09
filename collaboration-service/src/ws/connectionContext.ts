import type { WebSocket } from "ws";

export interface ConnectionContext {
  socket: WebSocket;
  userId: string;
  roomId?: string;        // set after JOIN_ROOM
  lastSeen: number;       // for heartbeats
}

export function makeContext(socket: WebSocket): ConnectionContext {
  return {
    socket,
    userId: randomId("u"), // simple local id; swap to JWT later
    lastSeen: Date.now(),
  };
}

export function randomId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
