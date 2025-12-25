/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/authStore";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  UserCircle2,
  Trash2,
  VolumeX,
  Volume2,
  Ban,
  MoreVertical,
  Unlock,
} from "lucide-react";
import apiClient from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ChatWindow from "@/components/ChatWindow";

const MessagesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const contactIdParam = searchParams.get("contactId");

  const {
    joinChat,
    activeChatUser,
    contacts,
    fetchContacts,
    ensureContactInList,
  } = useChatStore();

  const token = useAuthStore((s) => s.token);
  const [isInitializing, setIsInitializing] = useState(false);

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    contactId: number | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    contactId: null,
  });

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token) {
      fetchContacts();
    }
  }, [token, fetchContacts]);

  useEffect(() => {
    const initChat = async () => {
      if (!contactIdParam) return;

      const targetId = Number(contactIdParam);
      if (isNaN(targetId)) return;

      if (activeChatUser === targetId) return;

      setIsInitializing(true);

      const existingContact = contacts.find((c) => c.id === targetId);

      if (existingContact) {
        joinChat(targetId);
      } else {
        try {
          const { data: user } = await apiClient.get(`/messages/${targetId}`);
          ensureContactInList(user);
          joinChat(targetId);
        } catch (error) {
          console.error("Error fetching new contact details", error);
        }
      }
      setIsInitializing(false);
    };

    initChat();
  }, [contactIdParam, contacts, joinChat, activeChatUser, ensureContactInList]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };

    if (contextMenu.visible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenu.visible]);

  const handleContactClick = (contactId: number) => {
    setSearchParams({ contactId: String(contactId) });
  };

  const handleContextMenu = (e: React.MouseEvent, contactId: number) => {
    e.preventDefault();

    let x = e.clientX;
    let y = e.clientY;

    if (x + 200 > window.innerWidth) x -= 200;
    if (y + 150 > window.innerHeight) y -= 150;

    setContextMenu({
      visible: true,
      x,
      y,
      contactId,
    });
  };

  const handleRemove = async (id: number) => {
    try {
      await apiClient.delete(`/users/conversations/${id}`);
      toast.success("Conversation removed");

      fetchContacts();
      if (activeChatUser === id) {
        setSearchParams({});
        useChatStore.setState({ activeChatUser: null, messages: [] });
      }
    } catch (error) {
      console.error("Failed to remove chat", error);
      toast.error("Failed to remove conversation");
    } finally {
      setContextMenu((prev) => ({ ...prev, visible: false }));
    }
  };

  const handleMute = async (id: number) => {
    try {
      await apiClient.post("/users/mute", { targetId: id });
      toast.success("Notifications muted");
      fetchContacts();
    } catch (error) {
      console.error("Failed to mute user", error);
      toast.error("Failed to mute user");
    } finally {
      setContextMenu((prev) => ({ ...prev, visible: false }));
    }
  };

  const handleUnmute = async (id: number) => {
    try {
      await apiClient.post("/users/unmute", { targetId: id });
      toast.success("Notifications unmuted");
      fetchContacts();
    } catch (error) {
      console.error("Failed to unmute user", error);
      toast.error("Failed to unmute user");
    } finally {
      setContextMenu((prev) => ({ ...prev, visible: false }));
    }
  };

  const handleBlock = async (id: number) => {
    try {
      await apiClient.post("/users/block", { targetId: id });
      toast.success("User blocked");
      fetchContacts();
      if (activeChatUser === id) {
        setSearchParams({});
        useChatStore.setState({ activeChatUser: null, messages: [] });
      }
    } catch (error) {
      console.error("Failed to block user", error);
      toast.error("Failed to block user");
    } finally {
      setContextMenu((prev) => ({ ...prev, visible: false }));
    }
  };

  const handleUnblock = async (id: number) => {
    try {
      await apiClient.post("/users/unblock", { targetId: id });
      toast.success("User unblocked");
      fetchContacts();
    } catch (error) {
      console.error("Failed to unblock user", error);
      toast.error("Failed to unblock user");
    } finally {
      setContextMenu((prev) => ({ ...prev, visible: false }));
    }
  };

  const selectedContact = contextMenu.contactId
    ? contacts.find((c) => c.id === contextMenu.contactId)
    : null;

  const isBlocked = selectedContact
    ? (selectedContact as any).isBlocked
    : false;
  const isMuted = selectedContact ? (selectedContact as any).isMuted : false;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto py-6 max-w-6xl h-[calc(100vh-80px)] relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="hidden md:flex flex-col border-r h-full bg-gray-50/50">
            <div className="p-4 border-b bg-muted/50 flex justify-between items-center">
              <h2 className="text-xl font-bold">Messages</h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              {contacts.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No conversations yet. <br /> Visit Sponsors page to start one!
                </div>
              ) : (
                <div className="flex flex-col pb-20">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      onContextMenu={(e) => handleContextMenu(e, contact.id)}
                      className="relative group select-none"
                    >
                      <button
                        onClick={() => handleContactClick(contact.id)}
                        className={`w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-gray-100 border-b border-gray-100 ${
                          activeChatUser === contact.id
                            ? "bg-blue-50 border-l-4 border-l-blue-500"
                            : ""
                        }`}
                      >
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                          {contact.avatar ? (
                            <img
                              src={contact.avatar}
                              alt={contact.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserCircle2 className="h-6 w-6 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="font-medium text-gray-900 truncate">
                              {contact.name || `User #${contact.id}`}
                            </p>
                            {contact.unreadCount && contact.unreadCount > 0 ? (
                              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {contact.unreadCount}
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-1">
                            <p className="text-xs text-gray-500 capitalize truncate">
                              {(contact as any).isBlocked ? (
                                <span className="text-red-600 font-medium">
                                  Blocked
                                </span>
                              ) : (
                                contact.user_type?.toLowerCase()
                              )}
                            </p>
                            {(contact as any).isMuted && (
                              <VolumeX className="h-3 w-3 text-gray-400 ml-1" />
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 h-full bg-white flex flex-col max-h-[744px]">
            {activeChatUser !== null ? (
              <>
                <ChatWindow
                  targetUserId={activeChatUser}
                  myToken={token || ""}
                />
              </>
            ) : (
              <div className="flex flex-col h-full items-center justify-center text-muted-foreground bg-gray-50/30 p-8 text-center">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <UserCircle2 className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700">
                  Your Messages
                </h3>
                <p className="max-w-xs mt-2">
                  Select a contact from the left or start a new conversation
                  from the Sponsors page.
                </p>
              </div>
            )}
          </div>
        </div>

        {contextMenu.visible && contextMenu.contactId && (
          <div
            ref={menuRef}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed z-50 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="px-3 py-2 border-b bg-gray-50 text-xs font-semibold text-gray-500">
              Actions
            </div>

            <button
              onClick={() => handleRemove(contextMenu.contactId!)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Trash2 size={16} className="text-gray-500" />
              Remove chat
            </button>

            {isMuted ? (
              <button
                onClick={() => handleUnmute(contextMenu.contactId!)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Volume2 size={16} className="text-gray-500" />
                Unmute notifications
              </button>
            ) : (
              <button
                onClick={() => handleMute(contextMenu.contactId!)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <VolumeX size={16} className="text-gray-500" />
                Mute notifications
              </button>
            )}

            {isBlocked ? (
              <button
                onClick={() => handleUnblock(contextMenu.contactId!)}
                className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2 border-t mt-1"
              >
                <Unlock size={16} className="text-green-600" />
                Unblock user
              </button>
            ) : (
              <button
                onClick={() => handleBlock(contextMenu.contactId!)}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t mt-1"
              >
                <Ban size={16} className="text-red-600" />
                Block user
              </button>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MessagesPage;
