import { AuthUser } from "@/stores/authStore";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initializeSocket = (user: AuthUser) => {
  socket = io(import.meta.env.VITE_WS_URL, {
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    socket.emit("handshake", user.id, () => {
      console.log("Socket initialized for user", user.id);
    });
  });

  return socket;
};

export const getSocket = () => socket;
