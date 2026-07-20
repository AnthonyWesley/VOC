import { ISocketServer } from "./ISocketServer";
import { NullSocketServer } from "./NullSocketServer";

let socketServer: ISocketServer = new NullSocketServer();

export function setSocketServer(server: ISocketServer) {
  socketServer = server;
}

export { socketServer };
