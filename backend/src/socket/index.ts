import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/Message";
import BlockedUser from "../models/BlockedUser";

interface DecodedToken {
  id: number;
  email: string;
  role: string;
}

interface AuthSocket extends Socket {
  user?: DecodedToken;
}

export class ServerSocket {
  public static instance: ServerSocket;
  public io: Server;
  public users: { [uid: number]: string };

  constructor(server: any) {
    ServerSocket.instance = this;
    this.users = {};
    this.io = new Server(server, {
      serveClient: false,
      pingInterval: 10000,
      pingTimeout: 5000,
      cookie: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.start();
  }

  start() {
    this.io.use((socket: AuthSocket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next();
      }

      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET as string
        ) as DecodedToken;

        if (decoded.id === undefined || decoded.id === null) {
          return next(new Error("Authentication error: Invalid User ID"));
        }

        socket.user = decoded;
        next();
      } catch (err) {
        next(new Error("Authentication error: Invalid token"));
      }
    });

    this.io.on("connection", (socket: AuthSocket) => {
      if (socket.user?.id !== undefined) {
        console.log(`✅ User connected: ${socket.user.id}`);
        this.users[socket.user.id] = socket.id;
        socket.join(`user_${socket.user.id}`);
      } else {
        console.log("👤 Guest connected");
      }

      socket.on("join_chat", ({ targetUserId }) => {
        const myId = socket.user?.id;

        if (myId === undefined || targetUserId === undefined) return;
        if (myId === targetUserId) return;

        const roomId = [myId, targetUserId].sort((a, b) => a - b).join("_");
        socket.join(`chat_${roomId}`);
      });

      socket.on(
        "send_message",
        async ({ targetUserId, content, attachmentUrl, attachmentType }) => {
          const myId = socket.user?.id;

          if (myId === undefined) {
            socket.emit("error", { message: "You must be logged in." });
            return;
          }

          if (targetUserId === undefined) {
            socket.emit("error", { message: "Invalid recipient." });
            return;
          }

          if (Number(myId) === Number(targetUserId)) {
            socket.emit("error", { message: "Cannot message yourself." });
            return;
          }

          try {
            const isBlockedByTarget = await BlockedUser.findOne({
              where: {
                blockerId: targetUserId,
                blockedId: myId,
              },
            });

            if (isBlockedByTarget) {
              socket.emit("error", {
                message:
                  "You cannot send messages to this user (you are blocked).",
              });
              return;
            }

            const didIBlock = await BlockedUser.findOne({
              where: {
                blockerId: myId,
                blockedId: targetUserId,
              },
            });

            if (didIBlock) {
              socket.emit("error", {
                message: "Unblock this user first to send messages.",
              });
              return;
            }

            const tId = Number(targetUserId);

            const newMessage = await Message.create({
              senderId: myId,
              receiverId: tId,
              content: content || "",
              attachmentUrl,
              attachmentType,
            });

            const roomId = [Number(myId), tId].sort((a, b) => a - b).join("_");
            const chatRoomName = `chat_${roomId}`;

            const personalRoomName = `user_${tId}`;

            const msgData = newMessage.toJSON ? newMessage.toJSON() : newMessage;

            this.io.to(chatRoomName).to(personalRoomName).emit("receive_message", msgData);
          } catch (error) {
            console.error("Error saving message:", error);
            socket.emit("error", { message: "Failed to send message" });
          }
        }
      );

      socket.on("disconnect", () => {
        if (socket.user?.id !== undefined) {
          delete this.users[socket.user.id];
          console.log(`User disconnected: ${socket.user.id}`);
        }
      });
    });
  }
}
