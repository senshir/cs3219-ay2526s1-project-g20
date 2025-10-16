import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { RoomRegistry } from "../rooms/roomRegistry";
import { makeContext } from "./connectionContext";
import { ClientMessage, ServerMessage, safeParse } from "./messageTypes";

interface WSInitOptions {
  path: string;
  logger?: any; // Fastify logger (pino-compatible)
}

const HEARTBEAT_MS = 30_000;

export async function initWebsocketServer(
  httpServer: HttpServer,
  options: WSInitOptions
) {
  const wss = new WebSocketServer({ server: httpServer, path: options.path });
  const rooms = new RoomRegistry();
  const log = options.logger ?? console;

  // Heartbeat timer to detect idle/broken connections
  setInterval(() => {
    wss.clients.forEach((ws: WebSocket & { __ctx?: any }) => {
      const ctx = ws.__ctx;
      if (!ctx) return;
      const now = Date.now();
      if (now - ctx.lastSeen > HEARTBEAT_MS * 2) {
        try {
          ws.close(4000, "heartbeat-timeout");
        } catch {}
      } else {
        // ping clients; they'll respond with PING or any other message
        try {
          ws.send(JSON.stringify({ type: "PONG" } as ServerMessage));
        } catch {}
      }
    });
  }, HEARTBEAT_MS).unref();

  wss.on("connection", (ws, req) => {
    const ctx = makeContext(ws);
    (ws as any).__ctx = ctx;

    log.info({ ip: req.socket.remoteAddress, userId: ctx.userId }, "WS connected");

    ws.on("message", (buf) => {
      ctx.lastSeen = Date.now();
      const raw = buf.toString();
      const msg = safeParse<ClientMessage>(raw);
      if (!msg || typeof (msg as any).type !== "string") {
        return send(ws, { type: "ERROR", code: "BAD_JSON", message: "Invalid message" });
      }

      switch (msg.type) {
        case "PING":
          return send(ws, { type: "PONG" });

        case "JOIN_ROOM": {
          const { roomId } = msg;
          if (!roomId) {
            return send(ws, { type: "ERROR", code: "ROOM_ID_REQUIRED", message: "roomId is required" });
          }

          // Leave previous room if any
          if (ctx.roomId) {
            rooms.leave(ctx.roomId, ws);
          }
          ctx.roomId = roomId;
          const participants = rooms.join(roomId, ws);

          send(ws, { type: "JOINED", roomId, participants });

          // (Optional) notify others someone joined (not strictly necessary)
          rooms.broadcast(roomId, { type: "AWARENESS_BROADCAST", from: ctx.userId, payload: { event: "join" } }, ws);
          return;
        }

        case "LEAVE_ROOM": {
          if (!ctx.roomId) return;
          const prev = ctx.roomId;
          rooms.leave(prev, ws);
          ctx.roomId = undefined;
          send(ws, { type: "LEFT", roomId: prev });
          rooms.broadcast(prev, { type: "AWARENESS_BROADCAST", from: ctx.userId, payload: { event: "leave" } }, ws);
          return;
        }

        case "AWARENESS_UPDATE": {
          if (!ctx.roomId) return;
          rooms.broadcast(ctx.roomId, { type: "AWARENESS_BROADCAST", from: ctx.userId, payload: msg.payload }, ws);
          return;
        }

        case "TEXT_UPDATE": {
          if (!ctx.roomId) return;
          // For now just relay to others. Later, plug into Yjs manager.
          rooms.broadcast(ctx.roomId, { type: "TEXT_BROADCAST", from: ctx.userId, payload: msg.payload }, ws);
          return;
        }

        default:
          return send(ws, { type: "ERROR", code: "UNKNOWN_TYPE", message: `Unknown type ${(msg as any).type}` });
      }
    });

    ws.on("close", () => {
      // Ensure we’re removed from any room
      if ((ws as any).__ctx?.roomId) {
        const r = (ws as any).__ctx.roomId;
        rooms.leave(r, ws);
        rooms.broadcast(r, { type: "AWARENESS_BROADCAST", from: (ws as any).__ctx.userId, payload: { event: "leave" } }, ws);
      } else {
        rooms.leaveAll(ws);
      }
      log.info({ userId: ctx.userId }, "WS disconnected");
    });

    ws.on("error", (err) => {
      log.error({ err, userId: ctx.userId }, "WS error");
    });
  });

  log.info({ path: options.path }, "WebSocket server ready");
  return wss;
}

function send(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}
