import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { ISocketServer } from "./ISocketServer";

const onlineUsers = new Map<string, Set<string>>();

function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const pair of cookieHeader.split(";")) {
    const [key, ...val] = pair.trim().split("=");
    if (key) cookies[key.trim()] = val.join("=");
  }
  return cookies;
}

export class SocketServer implements ISocketServer {
  private io: Server;

  constructor(server: HttpServer) {
    const secret = process.env.JWT_SECRET;

    this.io = new Server(server, {
      path: "/socket.io/",
      cors: {
        origin: ["http://localhost:5173", "http://localhost:5174"],
        credentials: true,
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
    });

    this.io.use((socket, next) => {
      const cookies = parseCookies(socket.request.headers.cookie);
      const token = cookies.accessToken;

      if (!token) return next(new Error("UNAUTHORIZED"));

      try {
        const payload = jwt.verify(token, secret!) as { userId: string };
        socket.data.userId = payload.userId;
        socket.join(`user:${payload.userId}`);

        if (!onlineUsers.has(payload.userId)) {
          onlineUsers.set(payload.userId, new Set());
        }
        onlineUsers.get(payload.userId)!.add(socket.id);

        next();
      } catch {
        next(new Error("UNAUTHORIZED"));
      }
    });

    this.io.on("connection", (socket: Socket) => {
      socket.on("disconnect", () => {
        const userId = socket.data.userId as string | undefined;
        if (userId && onlineUsers.has(userId)) {
          const sockets = onlineUsers.get(userId)!;
          sockets.delete(socket.id);
          if (sockets.size === 0) onlineUsers.delete(userId);
        }
      });
    });
  }

  emit(eventName: string, payload: unknown) {
    this.io.emit(eventName, payload);
  }

  emitToUser(userId: string, eventName: string, payload: unknown) {
    this.io.to(`user:${userId}`).emit(eventName, payload);
  }

  getIO() {
    return this.io;
  }
}
