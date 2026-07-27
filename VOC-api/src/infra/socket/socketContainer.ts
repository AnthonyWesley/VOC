import { ISocketServer } from "./ISocketServer";
import { NullSocketServer } from "./NullSocketServer";
import { IRealtimeNotificationPublisher, RealtimeNotificationPublisher } from "./RealtimeNotificationPublisher";

let socketServer: ISocketServer = new NullSocketServer();

export function setSocketServer(server: ISocketServer) {
  socketServer = server;
}

const realtimePublisher: IRealtimeNotificationPublisher = new RealtimeNotificationPublisher(socketServer);

export { socketServer, realtimePublisher };
