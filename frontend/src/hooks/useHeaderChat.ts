import { useEffect, useMemo } from "react";
import { useChatStore } from "@/stores/useChatStore";

export const useHeaderChat = (token: string | null) => {
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const contacts = useChatStore((state) => state.contacts);
  const fetchContacts = useChatStore((state) => state.fetchContacts);

  useEffect(() => {
    if (token) {
      fetchContacts();
    }
  }, [token, fetchContacts]);

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

  return { totalUnread, sortedContacts, unreadCounts };
};