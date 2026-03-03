import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import apiClient from "@/api/apiClient";

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  attachmentUrl?: string;
  attachmentType?: string;
}

export interface ChatContact {
  id: number;
  name: string;
  user_type: string;
  country?: string;
  avatar?: string;
  unreadCount?: number;
  isBlocked?: boolean;
  amIBlocked?: boolean;
  isMuted?: boolean;
}

interface DecodedToken {
  id: number;
  email: string;
  role: string;
}

interface ChatState {
  socket: Socket | null;
  messages: Message[];
  unreadCounts: { [userId: number]: number };
  isConnected: boolean;
  activeChatUser: number | null;
  userId: number | null;
  token: string | null;
  isLoadingHistory: boolean;
  contacts: ChatContact[];

  connectSocket: (token: string) => void;
  joinChat: (targetUserId: number) => Promise<void>;
  sendMessage: (
    content: string,
    attachmentUrl?: string | null,
    attachmentType?: string | null
  ) => void;
  disconnectSocket: () => void;
  fetchContacts: () => Promise<void>;
  ensureContactInList: (user: ChatContact) => void;
  leaveChat: () => void;
}

const BASE_API_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_URL = new URL(BASE_API_URL).origin;

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  messages: [],
  unreadCounts: {},
  isConnected: false,
  activeChatUser: null,
  userId: null,
  token: null,
  isLoadingHistory: false,
  contacts: [],

  connectSocket: (token) => {
    if (get().socket) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decoded = jwtDecode<any>(token);
      set({ userId: decoded.id, token });
    } catch (err) {
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => set({ isConnected: true }));
    socket.on("disconnect", () => set({ isConnected: false }));

    socket.on("unblock_status_change", (data: { unblockerId: number }) => {
      const { activeChatUser, fetchContacts } = get();

      if (activeChatUser === data.unblockerId) {
        set((state) => {
          const updatedContacts = state.contacts.map((c) =>
            c.id === data.unblockerId ? { ...c, amIBlocked: false } : c
          );
          return { contacts: updatedContacts };
        });
      }

      fetchContacts();
    });

    socket.on("receive_message", (message: Message) => {
      console.log("📨 Soket: get new message", message);

      const { activeChatUser, userId, fetchContacts, contacts } = get();
      const senderId = Number(message.senderId);
      const myId = Number(userId);

      if (senderId === myId) {
        if (activeChatUser === Number(message.receiverId)) {
          set((state) => ({ messages: [...state.messages, message] }));
        }
        return;
      }

      const isChatOpen = activeChatUser === senderId;

      if (isChatOpen) {
        set((state) => ({ messages: [...state.messages, message] }));
        apiClient.patch("/messages/mark-read", { senderId });
      } else {
        set((state) => {
          const prevCount = state.unreadCounts[senderId] || 0;
          const newCounts = {
            ...state.unreadCounts,
            [senderId]: prevCount + 1,
          };
          console.log("🔴 ОБНОВЛЕН СЧЕТЧИК (Стейт):", newCounts);
          return { unreadCounts: newCounts };
        });

        if (!contacts.some((c) => c.id === senderId)) {
          console.log("🔄 Контакт не найден, загружаем список...");
          fetchContacts();
        }
      }
    });

    socket.on("error", (error: { message: string }) => {
      console.error("❌ Ошибка от сервера:", error.message);
      // Если используешь библиотеку тостов (у тебя есть Toaster), 
      // лучше вывести ошибку через неё. Но для теста сойдет и обычный alert:
      alert("Ошибка чата: " + error.message);
    });

    set({ socket });
  },

  joinChat: async (targetUserId) => {
    const { socket } = get();

    set((state) => ({
      messages: [],
      activeChatUser: targetUserId,
      isLoadingHistory: true,
      unreadCounts: { ...state.unreadCounts, [targetUserId]: 0 },
    }));

    if (socket) {
      socket.emit("join_chat", { targetUserId });
    }

    try {
      const response = await apiClient.get(`/messages/${targetUserId}`);
      set({ messages: response.data });

      await apiClient.patch("/messages/mark-read", { senderId: targetUserId });

      get().fetchContacts();
    } catch (err) {
      console.error("Failed to load chat history or mark read", err);
    } finally {
      set({ isLoadingHistory: false });
    }
  },

  fetchContacts: async () => {
    try {
      const response = await apiClient.get(`/messages/conversations`);
      const contactsData = response.data as ChatContact[];

      set((state) => {
        const newCounts: { [key: number]: number } = { ...state.unreadCounts };
        const { activeChatUser } = state;

        contactsData.forEach((c) => {
          if (newCounts[c.id] === undefined || (c.unreadCount || 0) > newCounts[c.id]) {
            newCounts[c.id] = c.unreadCount || 0;
          }
        });

        if (activeChatUser && newCounts[activeChatUser] !== undefined) {
          newCounts[activeChatUser] = 0;
        }

        return {
          contacts: contactsData,
          unreadCounts: newCounts
        };
      });
    } catch (err) {
      console.error("Failed to fetch contacts", err);
    }
  },

  ensureContactInList: (user) => {
    const { contacts } = get();
    const exists = contacts.some((c) => Number(c.id) === Number(user.id));
    if (!exists) {
      set({ contacts: [user, ...contacts] });
    }
  },

  sendMessage: (content, attachmentUrl = null, attachmentType = null) => {
    const { socket, activeChatUser } = get();
    if (!socket || activeChatUser === null) return;

    socket.emit("send_message", {
      targetUserId: activeChatUser,
      content,
      attachmentUrl,
      attachmentType,
    });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) socket.disconnect();

    set({
      socket: null,
      isConnected: false,
      messages: [],
      unreadCounts: {},
      activeChatUser: null,
      userId: null,
      token: null,
      isLoadingHistory: false,
    });
  },

  leaveChat: () => {
    set({ activeChatUser: null });
  },
}));
