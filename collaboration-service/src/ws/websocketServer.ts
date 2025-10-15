import { Server as HttpServer } from "http";
import { WebSocketServer } from "ws";

interface WSInitOptions {
  path: string;
  logger?: any;
}

export async function initWebsocketServer(
  httpServer: HttpServer,
  options: WSInitOptions
) {
  const wss = new WebSocketServer({ server: httpServer, path: options.path });

  options.logger?.info(`WebSocket server listening on ${options.path}`);

  wss.on("connection", (ws, req) => {
    options.logger?.info("New WebSocket client connected");

    ws.on("message", (msg) => {
      options.logger?.info(`Received: ${msg}`);
      ws.send(`Echo: ${msg}`);
    });

    ws.on("close", () => {
      options.logger?.info("Client disconnected");
    });
  });

  return wss;
}
