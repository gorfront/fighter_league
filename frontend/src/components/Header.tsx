import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  LogOut,
  UserCog,
  User,
  MessageSquare,
  UserCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import logo from "@/assets/logo.png";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/useChatStore";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Fighters", href: "/fighters" },
  { name: "Divisions", href: "/divisions" },
  { name: "Events", href: "/events" },
  { name: "Sponsors", href: "/sponsors" },
];

export const Header = () => {
  const token = useAuthStore((s) => s.token);
  const userType = useAuthStore((s) => s.userType);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const contacts = useChatStore((state) => state.contacts);
  const connectSocket = useChatStore((state) => state.connectSocket);
  const isConnected = useChatStore((state) => state.isConnected);
  const fetchContacts = useChatStore((state) => state.fetchContacts);

  const socket = useChatStore((state) => state.socket);
  const activeChatUser = useChatStore((state) => state.activeChatUser);
  const userId = useChatStore((state) => state.userId);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    if (token) {
      if (!isConnected) {
        connectSocket(token);
      }
      fetchContacts();
    }
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleNewMessage = (msg: any) => {
      const senderId = Number(msg.senderId);
      const myId = Number(userId);

      if (senderId === myId) return;

      if (senderId !== activeChatUser) {
        fetchContacts();
      }
    };

    socket.on("receive_message", handleNewMessage);

    return () => {
      socket.off("receive_message", handleNewMessage);
    };
  }, [socket, activeChatUser, userId, fetchContacts]);

  const totalUnread = useMemo(() => {
    return Object.values(unreadCounts || {}).reduce(
      (acc, count) => acc + count,
      0
    );
  }, [unreadCounts]);

  const sortedContacts = useMemo(() => {
    if (!contacts) return [];
    return [...contacts].sort((a, b) => {
      const unreadA = unreadCounts[a.id] || 0;
      const unreadB = unreadCounts[b.id] || 0;
      return unreadB - unreadA;
    });
  }, [contacts, unreadCounts]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleContactClick = (contactId: number) => {
    setIsPopoverOpen(false);
    navigate(`/dashboard/messages?contactId=${contactId}`);
  };

  const MessagesPopover = () => (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full px-0"
        >
          <MessageSquare className="h-5 w-5" />
          {totalUnread > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-background">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
          <h4 className="font-semibold text-sm">Messages</h4>
          <span className="text-xs text-muted-foreground">
            {totalUnread} unread
          </span>
        </div>
        <ScrollArea className="h-[300px]">
          {sortedContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {sortedContacts.map((contact) => {
                const unreadCount = unreadCounts[contact.id] || 0;
                return (
                  <button
                    key={contact.id}
                    onClick={() => handleContactClick(contact.id)}
                    className={`flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 border-b border-gray-50 last:border-0 ${
                      unreadCount > 0 ? "bg-blue-50/60 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
                        {contact.avatar ? (
                          <img
                            src={contact.avatar}
                            alt={contact.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserCircle2 className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-blue-600 border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-sm truncate ${
                            unreadCount > 0
                              ? "font-bold text-foreground"
                              : "font-medium text-foreground/80"
                          }`}
                        >
                          {contact.name || `User #${contact.id}`}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate capitalize">
                        {contact.user_type?.toLowerCase()}
                        {unreadCount > 0 && (
                          <span className="text-blue-600 font-medium ml-1">
                            ({unreadCount} new)
                          </span>
                        )}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t bg-muted/40">
          <Button
            variant="ghost"
            className="w-full text-xs h-8"
            onClick={() => {
              setIsPopoverOpen(false);
              navigate("/dashboard/messages");
            }}
          >
            View all messages
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );

  const renderMessagesLinkMobile = () => {
    return (
      <Button
        variant="ghost"
        asChild
        className="text-lg font-medium flex items-center justify-center w-full"
      >
        <Link to="/dashboard/messages">
          <div className="relative flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Messages
            {totalUnread > 0 && (
              <span className="ml-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </div>
        </Link>
      </Button>
    );
  };

  const renderProfileLink = (isMobile = false) => {
    const commonClass = isMobile
      ? "text-lg font-medium flex items-center justify-center"
      : "";
    const iconClass = isMobile ? "h-5 w-5 mr-2" : "h-4 w-4 mr-2";
    switch (userType) {
      case "ADMIN":
        return (
          <Button variant="ghost" asChild>
            <Link to="/dashboard/admin" className={commonClass}>
              <UserCog className={iconClass} />
              Admin
            </Link>
          </Button>
        );
      case "FIGHTER":
        return (
          <Button variant="ghost" asChild>
            <Link to="/dashboard/fighter" className={commonClass}>
              <User className={iconClass} />
              My Profile
            </Link>
          </Button>
        );
      case "SPONSOR":
        return (
          <Button variant="ghost" asChild>
            <Link to="/dashboard/sponsor" className={commonClass}>
              <User className={iconClass} />
              Sponsor Hub
            </Link>
          </Button>
        );
      case "DONOR":
        return (
          <Button variant="ghost" asChild>
            <Link to="/dashboard/donor" className={commonClass}>
              <User className={iconClass} />
              My Page
            </Link>
          </Button>
        );
      case "GUEST":
        return (
          <Button variant="ghost" asChild>
            <Link to="/dashboard/guest" className={commonClass}>
              <User className={iconClass} />
              Select Role
            </Link>
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Valor League" className="h-10 w-10" />
          <span className="text-xl font-bold">
            <span className="text-foreground">Valor </span>
            <span className="text-primary"> League</span>
          </span>
        </Link>

        <div className="hidden sm-md:flex items-center gap-6">
          <nav className="flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {token ? (
              <>
                <MessagesPopover />

                {renderProfileLink()}
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <Sheet>
          <SheetTrigger asChild className="sm-md:hidden">
            <Button variant="ghost" size="icon">
              <div className="relative">
                <Menu className="h-5 w-5" />
                {token && totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse" />
                )}
              </div>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <nav className="flex flex-col gap-4 mt-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-lg font-medium transition-colors hover:text-primary"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <hr className="my-6 border-border" />
            <div className="flex flex-col gap-4">
              {token ? (
                <>
                  {renderMessagesLinkMobile()}

                  {renderProfileLink(true)}
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="text-lg font-medium w-full"
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    asChild
                    className="text-lg font-medium w-full"
                  >
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button asChild className="text-lg font-medium w-full">
                    <Link to="/register">Register</Link>
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
