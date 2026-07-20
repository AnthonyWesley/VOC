import "dotenv/config";
import { createServer } from "http";
import { app } from "./main";
import { SocketServer } from "./infra/socket/SocketServer";
import { setSocketServer } from "./infra/socket/socketContainer";
import { setWhatsAppService } from "./infra/whatsapp/whatsappContainer";
import { WhatsAppInstanceService } from "./infra/whatsapp/WhatsAppInstanceService";
import { startInactiveMembersCron } from "./infra/cron/checkInactiveMembers";

const PORT = 3333;

const httpServer = createServer(app);

const socketServer = new SocketServer(httpServer);
setSocketServer(socketServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  if (process.env.EVOLUTION_URL) {
    setWhatsAppService(new WhatsAppInstanceService());
    console.log("WhatsApp Evolution service activated");
  }

  if (process.env.CRON_ENABLED === "true") {
    startInactiveMembersCron();
  }

});
