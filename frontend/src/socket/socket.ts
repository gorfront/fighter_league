import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";

const URL = import.meta.env.VITE_WS_URL || "http://localhost:3000";

export const socket: Socket = io(URL, {
  autoConnect: false,
  transports: ["websocket"],
  reconnection: true, 
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

export const connectSocket = () => {
  if (socket.connected) {
    console.log("Socket already connected.");
    return;
  }

  const token = useAuthStore.getState().token;

  if (token) {
    socket.auth = { token };
  } else {
    socket.auth = {};
  }
  socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const getSocket = () => socket;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const initializeSocket = (user?: any) => {
  connectSocket();
  return socket;
};

socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  if (reason === "io server disconnect") {
    console.warn("Socket disconnected by server. Stopping reconnect.");
    socket.disconnect();
  } else {
    console.warn("❌ Socket disconnected:", reason);
  }
});

socket.on("connect_error", (err) => {
  console.error("⚠️ Socket connection error:", err.message);
});

export default socket;
