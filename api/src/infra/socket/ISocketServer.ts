export interface ISocketServer {
  emit(eventName: string, payload: unknown): void;
  emitToUser(userId: string, eventName: string, payload: unknown): void;
  isUserOnline(userId: string): boolean;
  getOnlineUserCount(): number;
}
