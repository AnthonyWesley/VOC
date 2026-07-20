import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { ISocketServer } from "./ISocketServer";

const onlineUsers = new Map<string, Set<string>>();

export class SocketServer implements ISocketServer {
  private io: Server;

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      path: "/socket.io/",
      cors: {
        origin: ["http://localhost:5173", "http://localhost:5174"],
        credentials: true,
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
    });

    this.io.on("connection", (socket: Socket) => {
      socket.on("auth", (userId: string) => {
        if (!userId) return;
        if (!onlineUsers.has(userId)) {
          onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId)!.add(socket.id);
        socket.join(userId);
      });

      socket.on("disconnect", () => {
        for (const [userId, sockets] of onlineUsers) {
          if (sockets.delete(socket.id) && sockets.size === 0) {
            onlineUsers.delete(userId);
          }
        }
      });
    });
  }

  emit(eventName: string, payload: unknown) {
    this.io.emit(eventName, payload);
  }

  emitToUser(userId: string, eventName: string, payload: unknown) {
    this.io.to(userId).emit(eventName, payload);
  }

  getIO() {
    return this.io;
  }
}
