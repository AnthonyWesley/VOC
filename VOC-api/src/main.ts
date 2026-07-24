import "dotenv/config";
import { createServer } from "http";
import { app } from "./app";

const PORT = parseInt(process.env.PORT || "3333", 10);

const httpServer = createServer(app);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function shutdown(signal: string): void {
  console.log(`Received ${signal}, shutting down gracefully...`);
  httpServer.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
