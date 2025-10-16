import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { RoomRegistry } from "../rooms/roomRegistry";
import { makeContext } from "./connectionContext";
import { ClientMessage, ServerMessage, safeParse } from "./messageTypes";
import { extractTokenFromReq, verifyToken, AuthConfig, UserClaims } from "../auth/jwt";

interface WSInitOptions {
  path: string;
  logger?: any;          // Fastify logger (pino-compatible)
  auth: AuthConfig;      // NEW: auth config injected from server.ts
}

const HEARTBEAT_MS = 30_000;

export async function initWebsocketServer(
  httpServer: HttpServer,
  options: WSInitOptions
) {
  const wss = new WebSocketServer({ server: httpServer, path: options.path });
  const rooms = new RoomRegistry();
  const log = options.logger ?? console;

  // Heartbeat
  setInterval(() => {
    wss.clients.forEach((ws: WebSocket & { __ctx?: any }) => {
      const ctx = ws.__ctx;
      if (!ctx) return;
      const now = Date.now();
      if (now - ctx.lastSeen > HEARTBEAT_MS * 2) {
        try { ws.close(4000, "heartbeat-timeout"); } catch {}
      } else {
        try { ws.send(JSON.stringify({ type: "PONG" } as ServerMessage)); } catch {}
      }
    });
  }, HEARTBEAT_MS).unref();

  wss.on("connection", (ws, req) => {
    // ---- NEW: authenticate the connection ----
    const token = extractTokenFromReq(req);
    if (!token) {
      ws.close(4401, "unauthorized"); // 4401 = custom WS close code
      return;
    }

    let claims: UserClaims;
    try {
      claims = verifyToken(token, options.auth);
    } catch (err: any) {
      log.warn({ err: err?.message }, "JWT verification failed");
      ws.close(4401, "invalid-token");
      return;
    }

    const ctx = makeContext(ws);
    (ws as any).__ctx = ctx;
    // Overwrite userId with the JWT identity
    ctx.userId = claims.userId;
    (ctx as any).claims = claims;

    log.info(
      { ip: req.socket.remoteAddress, userId: ctx.userId },
      "WS connected (authenticated)"
    );

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

          // ---- NEW: optional room claim enforcement ----
          if (options.auth.requireRoomClaim && claims.roomId && claims.roomId !== roomId) {
            return send(ws, { type: "ERROR", code: "FORBIDDEN_ROOM", message: "Not allowed to join this room" });
          }

          // leave previous room if any
          if (ctx.roomId) rooms.leave(ctx.roomId, ws);

          ctx.roomId = roomId;
          const participants = rooms.join(roomId, ws);
          send(ws, { type: "JOINED", roomId, participants });

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
          rooms.broadcast(ctx.roomId, { type: "TEXT_BROADCAST", from: ctx.userId, payload: msg.payload }, ws);
          return;
        }

        default:
          return send(ws, { type: "ERROR", code: "UNKNOWN_TYPE", message: `Unknown type ${(msg as any).type}` });
      }
    });

    ws.on("close", () => {
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

  log.info({ path: options.path }, "WebSocket server ready (auth enabled)");
  return wss;
}

function send(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}
