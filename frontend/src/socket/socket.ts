// import { AuthUser } from "@/stores/authStore";
// import { io, Socket } from "socket.io-client";

// let socket: Socket | null = null;

// export const initializeSocket = (user: AuthUser) => {
//   socket = io(import.meta.env.VITE_WS_URL, {
//     transports: ["websocket"],
//   });

//   socket.on("connect", () => {
//     socket.emit("handshake", user.id, () => {
//       console.log("Socket initialized for user", user.id);
//     });
//   });

//   return socket;
// };

// export const getSocket = () => socket;

import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";

const URL = import.meta.env.VITE_WS_URL || "http://localhost:3000";

export const socket: Socket = io(URL, {
  autoConnect: false,
  transports: ["websocket"],
});

export const connectSocket = () => {
  if (socket.connected) return;

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

socket.on("connect_error", (err) => {
  console.error("❌ Socket connection error:", err.message);
});

export default socket;
