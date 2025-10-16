// Messages the client can send to the server
export type ClientMessage =
  | { type: "JOIN_ROOM"; roomId: string }
  | { type: "LEAVE_ROOM" }
  | { type: "AWARENESS_UPDATE"; payload: any } // cursors, status, etc.
  | { type: "TEXT_UPDATE"; payload: any }      // placeholder for CRDT updates
  | { type: "PING" };

// Messages the server can send back to clients
export type ServerMessage =
  | { type: "JOINED"; roomId: string; participants: number }
  | { type: "LEFT"; roomId?: string }
  | { type: "AWARENESS_BROADCAST"; from: string; payload: any }
  | { type: "TEXT_BROADCAST"; from: string; payload: any }
  | { type: "PONG" }
  | { type: "ERROR"; code: string; message: string };

// quick helpers
export function safeParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
