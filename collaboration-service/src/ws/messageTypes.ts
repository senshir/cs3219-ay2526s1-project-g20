export type ClientMessage =
  | { type: "JOIN_ROOM"; roomId: string }
  | { type: "LEAVE_ROOM" }
  | { type: "AWARENESS_UPDATE"; payload: any }
  | { type: "TEXT_UPDATE"; payload: any }
  | { type: "PING" };

export type ServerMessage =
  | { type: "JOINED"; roomId: string; participants: number }
  | { type: "LEFT"; roomId?: string }
  | { type: "AWARENESS_BROADCAST"; from: string; payload: any }
  | { type: "TEXT_BROADCAST"; from: string; payload: any }
  | { type: "PONG" }
  | { type: "ERROR"; code: string; message: string };

export function safeParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
