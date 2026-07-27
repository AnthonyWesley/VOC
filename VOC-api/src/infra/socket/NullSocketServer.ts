import { ISocketServer } from "./ISocketServer";

export class NullSocketServer implements ISocketServer {
  emit(_eventName: string, _payload: unknown) {}
  emitToUser(_userId: string, _eventName: string, _payload: unknown) {}
  isUserOnline(_userId: string) { return false; }
  getOnlineUserCount() { return 0; }
}
