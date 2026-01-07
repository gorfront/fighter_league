// import { AuthUser } from "@/stores/authStore";
// import { io, Socket } from "socket.io-client";

// let socket: Socket | null = null;

// export const initializeSocket = (user: AuthUser) => {
// socket = io(import.meta.env.VITE_WS_URL, {
//   transports: ["websocket"],
// });

// socket.on("connect", () => {
//   socket.emit("handshake", user.id, () => {
//     console.log("Socket initialized for user", user.id);
//   });
// });

//   return socket;
// };

// export const getSocket = () => socket;
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";

const URL = import.meta.env.VITE_WS_URL || "http://localhost:3000";

export const socket: Socket = io(URL, {
  autoConnect: false,
  transports: ["websocket"],
  reconnection: true, // Allow auto-reconnect
  reconnectionAttempts: 10, // Give up after 10 tries if server is dead
  reconnectionDelay: 1000, // Wait 1s between retries (Prevents server hammer)
});

export const connectSocket = () => {
  // 1. If we are already connected, do nothing
  if (socket.connected) {
    console.log("Socket already connected.");
    return;
  }

  // 2. Get latest token
  const token = useAuthStore.getState().token;

  // 3. Set auth payload
  if (token) {
    socket.auth = { token };
  } else {
    socket.auth = {};
  }

  // 4. Connect
  // Note: We don't need to force disconnect here because we checked .connected above.
  // The backend handles duplicate IDs gracefully now.
  socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const getSocket = () => socket;

// Legacy support (Wrapper)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const initializeSocket = (user?: any) => {
  connectSocket();
  return socket;
};

// --- Debug Listeners ---

socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  // 'io server disconnect' means the server kicked us (e.g. invalid token)
  // We should NOT auto-reconnect in that case
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
