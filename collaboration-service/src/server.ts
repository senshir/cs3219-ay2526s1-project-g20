import { createApp, AppConfig } from "./app";
import { initWebsocketServer } from "./ws/websocketServer"; // you'll implement this
import type { Server as HttpServer } from "http";

// ---- minimal env/config parsing ----
function bool(v: string | undefined, def: boolean) {
  if (v === undefined) return def;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

const config: AppConfig = {
  port: Number(process.env.PORT ?? 8084),
  host: process.env.HOST ?? "0.0.0.0",
  wsPath: process.env.WS_PATH ?? "/ws",
  prometheusEnabled: bool(process.env.PROMETHEUS_ENABLED, true),
  serviceName: process.env.SERVICE_NAME ?? "collaboration-service",
  buildInfo: {
    commit: process.env.COMMIT_SHA ?? "dev",
    node: process.version,
  },
  // Example readiness checks (wire these to real deps like Redis)
  readinessChecks: [
    async () => {
      // e.g., await redis.ping(); throw if not ok
      return;
    },
  ],
};

async function main() {
  const app = createApp(config);

  // Fastify internally creates an http.Server; we can attach ws to it.
  const httpServer = app.server as HttpServer;

  // Initialize WebSocket handling on the same server/port
  await initWebsocketServer(httpServer, {
    path: config.wsPath,
    // You can pass any extra deps here (logger, redis, etc.)
    logger: app.log,
  });

  // Start HTTP listener
  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(
      {
        port: config.port,
        host: config.host,
        wsPath: config.wsPath,
      },
      "HTTP and WebSocket servers are up"
    );
  } catch (err) {
    app.log.error({ err }, "Failed to start server");
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    try {
      app.log.info({ signal }, "Shutting down gracefully…");
      // Give ws layer a chance to broadcast termination/end-session if needed
      // e.g., await shutdownWebsocketServer();
      await app.close();
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, "Error during shutdown");
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main();
