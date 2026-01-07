// import { Server, Socket } from "socket.io";
// import jwt from "jsonwebtoken";
// import Message from "../models/Message";
// import BlockedUser from "../models/BlockedUser";

// interface DecodedToken {
//   id: number;
//   email: string;
//   role: string;
// }

// interface AuthSocket extends Socket {
//   user?: DecodedToken;
// }

// export class ServerSocket {
//   public static instance: ServerSocket;
//   public io: Server;
//   public users: { [uid: number]: string };

//   constructor(server: any) {
//     ServerSocket.instance = this;
//     this.users = {};
//     this.io = new Server(server, {
//       serveClient: false,
//       pingInterval: 10000,
//       pingTimeout: 5000,
//       cookie: false,
//       cors: {
//         origin: "*",
//         methods: ["GET", "POST"],
//       },
//     });

//     this.start();
//   }

//   start() {
//     this.io.use((socket: AuthSocket, next) => {
//       const token = socket.handshake.auth.token;

//       if (!token) {
//         return next(new Error("Authentication error: No token provided"));
//       }

//       try {
//         const decoded = jwt.verify(
//           token,
//           process.env.JWT_SECRET as string
//         ) as DecodedToken;
//         socket.user = decoded;
//         next();
//       } catch (err) {
//         next(new Error("Authentication error: Invalid token"));
//       }
//     });

//     this.io.on("connection", (socket: AuthSocket) => {
//       if (socket.user?.id !== undefined) {
//         console.log(`User connected: ${socket.user.id}`);
//         this.users[socket.user.id] = socket.id;
//         socket.join(`user_${socket.user.id}`);
//       }

//       socket.on("join_chat", ({ targetUserId }) => {
//         const myId = socket.user?.id;

//         if (
//           myId === undefined ||
//           targetUserId === undefined ||
//           targetUserId === null
//         )
//           return;

//         const roomId = [myId, targetUserId].sort((a, b) => a - b).join("_");
//         socket.join(`chat_${roomId}`);
//       });

//       socket.on(
//         "send_message",
//         async ({ targetUserId, content, attachmentUrl, attachmentType }) => {
//           const myId = socket.user?.id;

//           if (
//             myId === undefined ||
//             targetUserId === undefined ||
//             targetUserId === null
//           )
//             return;
//           try {
//             const isBlockedByTarget = await BlockedUser.findOne({
//               where: {
//                 blockerId: targetUserId,

//                 blockedId: myId,
//               },
//             });

//             if (isBlockedByTarget) {
//               socket.emit("error", {
//                 message:
//                   "You cannot send messages to this user (you are blocked).",
//               });

//               return;
//             }

//             const didIBlock = await BlockedUser.findOne({
//               where: {
//                 blockerId: myId,
//                 blockedId: targetUserId,
//               },
//             });

//             if (didIBlock) {
//               socket.emit("error", {
//                 message: "Unblock this user first to send messages.",
//               });

//               return;
//             }

//             const newMessage = await Message.create({
//               senderId: myId,
//               receiverId: targetUserId,
//               content: content || "",
//               attachmentUrl,
//               attachmentType,
//             });

//             const roomId = [myId, targetUserId].sort((a, b) => a - b).join("_");
//             const chatRoomName = `chat_${roomId}`;

//             this.io.to(chatRoomName).emit("receive_message", newMessage);

//             const receiverSocketId = this.users[targetUserId];
//             if (receiverSocketId) {
//               const receiverSocket =
//                 this.io.sockets.sockets.get(receiverSocketId);
//               const isReceiverInChat = receiverSocket?.rooms.has(chatRoomName);
//               if (!isReceiverInChat) {
//                 this.io
//                   .to(receiverSocketId)
//                   .emit("receive_message", newMessage);
//               }
//             }
//           } catch (error) {
//             console.error("Error saving message:", error);
//             socket.emit("error", { message: "Failed to send message" });
//           }
//         }
//       );

//       socket.on("disconnect", () => {
//         if (socket.user?.id !== undefined) {
//           delete this.users[socket.user.id];
//         }
//       });
//     });
//   }
// }

// --------------------------------------------------------------------------------

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
        return next(); // Guest
      }

      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET as string
        ) as DecodedToken;

        // 🔥 FIX 1: Allow 0, but block undefined/null
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
      // 🔥 FIX 2: Check for undefined specifically, because 0 is falsy
      if (socket.user?.id !== undefined) {
        console.log(`✅ User connected: ${socket.user.id}`);
        this.users[socket.user.id] = socket.id;
        socket.join(`user_${socket.user.id}`);
      } else {
        console.log("👤 Guest connected");
      }

      socket.on("join_chat", ({ targetUserId }) => {
        const myId = socket.user?.id;

        // 🔥 FIX 3: Allow 0 in validation
        if (myId === undefined || targetUserId === undefined) return;
        if (myId === targetUserId) return;

        const roomId = [myId, targetUserId].sort((a, b) => a - b).join("_");
        socket.join(`chat_${roomId}`);
      });

      socket.on(
        "send_message",
        async ({ targetUserId, content, attachmentUrl, attachmentType }) => {
          const myId = socket.user?.id;

          // 🔥 FIX 4: Explicit undefined check to allow Admin (0) to send
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

            const newMessage = await Message.create({
              senderId: myId,
              receiverId: targetUserId,
              content: content || "",
              attachmentUrl,
              attachmentType,
            });

            const roomId = [myId, targetUserId].sort((a, b) => a - b).join("_");
            const chatRoomName = `chat_${roomId}`;

            this.io.to(chatRoomName).emit("receive_message", newMessage);

            const receiverSocketId = this.users[targetUserId];
            if (receiverSocketId) {
              const receiverSocket =
                this.io.sockets.sockets.get(receiverSocketId);
              if (receiverSocket && !receiverSocket.rooms.has(chatRoomName)) {
                this.io
                  .to(receiverSocketId)
                  .emit("receive_message", newMessage);
              }
            }
          } catch (error) {
            console.error("Error saving message:", error);
            socket.emit("error", { message: "Failed to send message" });
          }
        }
      );

      socket.on("disconnect", () => {
        // 🔥 FIX 5: Handle disconnect for ID 0
        if (socket.user?.id !== undefined) {
          delete this.users[socket.user.id];
          console.log(`User disconnected: ${socket.user.id}`);
        }
      });
    });
  }
}
