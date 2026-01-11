import { useEffect, useMemo } from "react";
import { useChatStore } from "@/stores/useChatStore";

export const useHeaderChat = (token: string | null) => {
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const contacts = useChatStore((state) => state.contacts);
  const connectSocket = useChatStore((state) => state.connectSocket);
  const isConnected = useChatStore((state) => state.isConnected);
  const fetchContacts = useChatStore((state) => state.fetchContacts);
  const socket = useChatStore((state) => state.socket);
  const activeChatUser = useChatStore((state) => state.activeChatUser);
  const userId = useChatStore((state) => state.userId);

  useEffect(() => {
    if (token && !isConnected) {
      connectSocket(token);
    }
  }, [token, isConnected, connectSocket]);

  useEffect(() => {
    if (token) {
      fetchContacts();
    }
  }, [token, fetchContacts]);


  useEffect(() => {
    if (!socket) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleNewMessage = (msg: any) => {
      const senderId = Number(msg.senderId);
      const myId = Number(userId);

      if (senderId === myId) return;
      if (senderId !== activeChatUser) fetchContacts();
    };

    socket.on("receive_message", handleNewMessage);
    return () => {
      socket.off("receive_message", handleNewMessage);
    };
  }, [socket, activeChatUser, userId, fetchContacts]);

  const totalUnread = useMemo(() => {
    return Object.values(unreadCounts || {}).reduce((acc, count) => acc + count, 0);
  }, [unreadCounts]);

  const sortedContacts = useMemo(() => {
    if (!contacts) return [];
    return [...contacts].sort((a, b) => {
      const unreadA = unreadCounts[a.id] || 0;
      const unreadB = unreadCounts[b.id] || 0;
      return unreadB - unreadA;
    });
  }, [contacts, unreadCounts]);

  return {
    totalUnread,
    sortedContacts,
    unreadCounts,
  };
};
