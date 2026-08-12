import "dotenv/config";
import { createServer, Server as HttpServer } from "http";
import { app } from "./app";
import { validateEnv } from "./shared/env";
import { SocketServer } from "./infra/socket/SocketServer";
import { setSocketServer } from "./infra/socket/socketContainer";
import { setWhatsAppService, createRealWhatsAppService } from "./infra/whatsapp/whatsappContainer";
import { setInstagramService, createRealInstagramService } from "./infra/instagram/instagramContainer";
import { startInactiveMembersCron, stopInactiveMembersCron } from "./infra/cron/checkInactiveMembers";
import { prisma } from "./package/prisma";
import { createLogger } from "./shared/logger/logger";

const logger = createLogger("server");

const env = validateEnv();

const httpServer: HttpServer = createServer(app);

const socketServer = new SocketServer(httpServer);
setSocketServer(socketServer);

httpServer.listen(env.port, () => {
  logger.info({ port: env.port }, "Server running");

  if (env.evolutionUrl) {
    setWhatsAppService(createRealWhatsAppService());
    logger.info("WhatsApp Evolution service activated");
  }

  if (env.instagramAccessToken && env.instagramUserId) {
    setInstagramService(createRealInstagramService());
    logger.info("Instagram media service activated");
  }

  if (env.cronEnabled) {
    startInactiveMembersCron();
  }
});

function shutdown(signal: string): void {
  logger.info({ signal }, "Shutting down gracefully");

  const forceExitTimer = setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  try {
    stopInactiveMembersCron();
  } catch (error: unknown) {
    logger.error({ error }, "Error stopping cron");
  }

  // Para de aceitar novas conexões (cobre HTTP + Socket.IO no mesmo server)
  httpServer.close(() => {
    finishShutdown(forceExitTimer);
  });

  // Desbloqueia close se houver conexões keep-alive ociosas
  if (typeof httpServer.closeIdleConnections === "function") {
    setTimeout(() => httpServer.closeIdleConnections(), 2_000).unref();
  }
  if (typeof httpServer.closeAllConnections === "function") {
    setTimeout(() => httpServer.closeAllConnections(), 8_000).unref();
  }
}

async function finishShutdown(forceExitTimer: NodeJS.Timeout): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info("Database disconnected");
  } catch (error: unknown) {
    logger.error({ error }, "Error disconnecting database");
  } finally {
    clearTimeout(forceExitTimer);
    process.exit(0);
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));