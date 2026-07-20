import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import useAuthStatus from "../../auth/hooks/useAuthStatus";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

export function useSocketNotifications() {
  const { isAuthenticated, authUserId } = useAuthStatus();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !authUserId) return;

    const socket = io(SOCKET_URL, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      socket.emit("auth", authUserId);
    });

    socket.on("notification", () => {
      queryClient.invalidateQueries({ queryKey: ["notificationsData"] });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, authUserId, queryClient]);
}
