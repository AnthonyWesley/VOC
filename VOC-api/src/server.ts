import "dotenv/config";
import { createServer } from "http";
import { app } from "./app";
import { SocketServer } from "./infra/socket/SocketServer";
import { setSocketServer } from "./infra/socket/socketContainer";
import { setWhatsAppService } from "./infra/whatsapp/whatsappContainer";
import { WhatsAppInstanceService } from "./infra/whatsapp/WhatsAppInstanceService";
import { startInactiveMembersCron } from "./infra/cron/checkInactiveMembers";
import { createLogger } from "./shared/logger/logger";

const PORT = 3333;
const logger = createLogger("server");

const httpServer = createServer(app);

const socketServer = new SocketServer(httpServer);
setSocketServer(socketServer);

httpServer.listen(PORT, () => {
  logger.info({ port: PORT }, "Server running");

  if (process.env.EVOLUTION_URL) {
    setWhatsAppService(new WhatsAppInstanceService());
    logger.info("WhatsApp Evolution service activated");
  }

  if (process.env.CRON_ENABLED === "true") {
    startInactiveMembersCron();
  }

});
