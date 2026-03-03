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
  Unlock,
  MessageSquare,
  Search,
  MoreVertical,
} from "lucide-react";
import apiClient from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import ChatWindow from "@/components/ChatWindow";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

const MessagesPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
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
  const [searchTerm, setSearchTerm] = useState("");

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    contactId: number | null;
  }>({ visible: false, x: 0, y: 0, contactId: null });

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token) fetchContacts();
  }, [token, fetchContacts]);

  useEffect(() => {
    const initChat = async () => {
      if (!contactIdParam) {
        useChatStore.setState({ activeChatUser: null });
        return;
      }
      const targetId = Number(contactIdParam);
      if (isNaN(targetId)) return;
      if (activeChatUser !== targetId) {
        const existingContact = contacts.find((c) => c.id === targetId);
        if (existingContact) {
          joinChat(targetId);
        } else {
          try {
            const { data: user } = await apiClient.get(`/messages/${targetId}`);
            ensureContactInList(user);
            joinChat(targetId);
          } catch (error) {
            console.error("Error fetching contact", error);
          }
        }
      }
    };
    initChat();
  }, [contactIdParam, contacts, joinChat, activeChatUser, ensureContactInList]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    if (contextMenu.visible)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [contextMenu.visible]);

  const handleContactClick = (contactId: number) => {
    setSearchParams({ contactId: String(contactId) });
    joinChat(contactId);
  };

  const handleBackToContacts = () => {
    setSearchParams({});
    useChatStore.setState({ activeChatUser: null });
  };

  const handleContextMenu = (e: React.MouseEvent, contactId: number) => {
    e.preventDefault();
    e.stopPropagation();
    let x = e.clientX;
    let y = e.clientY;
    if (x + 220 > window.innerWidth) x = window.innerWidth - 230;
    if (y + 200 > window.innerHeight) y = window.innerHeight - 210;
    setContextMenu({ visible: true, x, y, contactId });
  };

  const executeAction = async (
    action: () => Promise<void>,
    successMsg: string
  ) => {
    try {
      await action();
      toast({
        title: t("success_title", "Success"),
        description: successMsg
      });
      fetchContacts();
      if (
        successMsg === t("conversation_removed") &&
        activeChatUser === contextMenu.contactId
      ) {
        handleBackToContacts();
      }
    } catch (e) {
      toast({
        title: t("error_title", "Error"),
        description: t("action_failed", "Action failed"),
        variant: "destructive"
      });
    } finally {
      setContextMenu((p) => ({ ...p, visible: false }));
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.name?.toLowerCase().includes(searchTerm?.toLowerCase())
  );

  const selectedContact = contextMenu.contactId
    ? contacts.find((c) => c.id === contextMenu.contactId)
    : null;
  const isBlocked = (selectedContact as any)?.isBlocked;
  const isMuted = (selectedContact as any)?.isMuted;

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden">
      <Header />

      <main className="flex-1 flex flex-col w-full h-full md:container md:mx-auto md:py-6 md:px-4 md:max-w-6xl min-h-0 relative">
        <div className="flex-1 flex bg-card md:rounded-2xl md:shadow-xl md:border md:border-border overflow-hidden relative min-h-0 h-full w-full">
          <div
            className={`
              flex-col h-full bg-card border-r border-border w-full md:w-[320px] lg:w-[380px] shrink-0
              ${activeChatUser !== null ? "hidden md:flex" : "flex"} 
            `}
          >
            <div className="p-3 md:p-4 border-b border-border space-y-3 shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {t("messages_title")}
                </h2>
                <div className="bg-primary/20 p-2 rounded-full">
                  <MessageSquare size={18} className="text-primary" />
                </div>
              </div>
              <div className="relative">
                <Search
                  className="absolute left-3 top-2.5 h-4 w-4 text-primary"
                  style={{ zIndex: 1 }}
                />
                <Input
                  placeholder={t("search_placeholder_short")}
                  className="pl-9 bg-muted/50 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50 h-9 md:h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scroll">
              {contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground p-6 text-center">
                  <MessageSquare size={40} className="mb-3 opacity-20" />
                  <p className="text-sm">{t("no_conversations")}</p>
                </div>
              ) : (
                <div className="flex flex-col pb-20 md:pb-0">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => handleContactClick(contact.id)}
                      onContextMenu={(e) => handleContextMenu(e, contact.id)}
                      className={`
                        relative group flex items-center gap-3 p-3 md:p-4 cursor-pointer transition-all border-b border-border/50 hover:bg-muted/50
                        ${activeChatUser === contact.id
                          ? "bg-muted/80 border-l-4 border-l-primary"
                          : "border-l-4 border-l-transparent"
                        }
                      `}
                    >
                      <div className="relative shrink-0">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
                          {contact.avatar ? (
                            <img
                              src={contact.avatar}
                              alt={contact.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserCircle2 className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <p
                            className={`text-sm font-semibold truncate ${(contact as any).isBlocked
                              ? "text-muted-foreground"
                              : "text-foreground"
                              }`}
                          >
                            {contact.name || t("user_default_name", { id: contact.id })}
                          </p>
                          {contact.unreadCount && contact.unreadCount > 0 ? (
                            <span className="ml-2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                              {contact.unreadCount}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground truncate">
                            <span className="italic text-muted-foreground">
                              {contact.user_type?.toLowerCase()}
                            </span>
                          </p>
                          {(contact as any).isMuted && (
                            <VolumeX
                              size={12}
                              className="text-muted-foreground shrink-0"
                            />
                          )}
                        </div>
                      </div>

                      <button
                        className="md:hidden p-2 text-muted-foreground hover:text-foreground -mr-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContextMenu(e, contact.id);
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            className={`
              flex-col flex-1 h-full bg-card relative min-w-0
              ${activeChatUser !== null
                ? "flex fixed inset-0 z-50 md:static md:z-auto"
                : "hidden md:flex"
              }
            `}
          >
            {activeChatUser !== null ? (
              <ChatWindow
                targetUserId={activeChatUser}
                myToken={token || ""}
                onBack={handleBackToContacts}
              />
            ) : (
              <div className="hidden md:flex flex-col h-full items-center justify-center text-muted-foreground bg-muted/30 p-8 text-center select-none">
                <div className="bg-muted p-6 rounded-full shadow-lg border border-border mb-6">
                  <MessageSquare size={48} className="text-primary/40" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {t("welcome_messages")}
                </h3>
                <p className="max-w-xs text-sm text-muted-foreground">
                  {t("select_conversation_prompt")}
                </p>
              </div>
            )}
          </div>
        </div>

        {contextMenu.visible && contextMenu.contactId && (
          <div
            ref={menuRef}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed z-[60] w-52 bg-popover rounded-lg shadow-2xl border border-border py-1.5 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="px-3 py-1.5 border-b border-border mb-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("manage_chat_title")}
              </span>
            </div>
            <button
              onClick={() =>
                executeAction(
                  () =>
                    isMuted
                      ? apiClient.post("/users/unmute", {
                        targetId: contextMenu.contactId,
                      })
                      : apiClient.post("/users/mute", {
                        targetId: contextMenu.contactId,
                      }),
                  isMuted ? t("chat_unmuted") : t("chat_muted")
                )
              }
              className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-muted/50 flex items-center gap-3"
            >
              {isMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
              {isMuted ? t("chat_unmute") : t("chat_mute")}
            </button>
            <button
              onClick={() =>
                executeAction(
                  () =>
                    apiClient.delete(
                      `/users/conversations/${contextMenu.contactId}`
                    ),
                  t("conversation_removed")
                )
              }
              className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-muted/50 flex items-center gap-3"
            >
              <Trash2 size={16} />
              {t("delete_btn")}
            </button>
            <div className="my-1 border-t border-border" />
            <button
              onClick={() =>
                executeAction(
                  () =>
                    isBlocked
                      ? apiClient.post("/users/unblock", {
                        targetId: contextMenu.contactId,
                      })
                      : apiClient.post("/users/block", {
                        targetId: contextMenu.contactId,
                      }),
                  isBlocked ? t("chat_unblocked") : t("chat_blocked")
                )
              }
              className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 ${isBlocked
                ? "text-green-500 hover:bg-muted/50"
                : "text-red-500 hover:bg-muted/50"
                }`}
            >
              {isBlocked ? <Unlock size={16} /> : <Ban size={16} />}
              {isBlocked ? t("chat_unblock") : t("chat_block")}
            </button>
          </div>
        )}
      </main>

      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
};

export default MessagesPage;
