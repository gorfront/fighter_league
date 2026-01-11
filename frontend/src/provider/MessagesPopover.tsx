import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { MessageSquare, UserCircle2 } from "lucide-react";
import { ChatContact } from "@/stores/useChatStore";
import { TFunction } from "i18next";

interface MessagesPopoverProps {
  isPopoverOpen: boolean;
  setIsPopoverOpen: (open: boolean) => void;
  totalUnread: number;
  t: TFunction;
  sortedContacts: ChatContact[];
  unreadCounts: Record<number, number>;
  onContactClick: (id: number) => void;
  onViewAllClick: () => void;
}

export const MessagesPopover = ({
  isPopoverOpen,
  setIsPopoverOpen,
  totalUnread,
  t,
  sortedContacts,
  unreadCounts,
  onContactClick,
  onViewAllClick,
}: MessagesPopoverProps) => (
  <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
    <PopoverTrigger asChild>
      <Button variant="ghost" className="relative h-10 w-10 rounded-full px-0">
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
        <h4 className="font-semibold text-sm">{t("header_messages_title")}</h4>
        <span className="text-xs text-muted-foreground">
          {t("unread_count", { count: totalUnread })}
        </span>
      </div>
      <ScrollArea className="h-[300px]">
        {sortedContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">{t("header_no_conversations")}</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {sortedContacts.map((contact) => {
              const unreadCount = unreadCounts[contact.id] || 0;
              return (
                <button
                  key={contact.id}
                  onClick={() => onContactClick(contact.id)}
                  className={`flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 border-b border-border/50 last:border-0 ${
                    unreadCount > 0 ? "bg-blue-50/60 dark:bg-blue-900/20" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
                      {contact.avatar ? (
                        <img src={contact.avatar} alt={contact.name} className="h-full w-full object-cover" />
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
                      <span className={`text-sm truncate ${unreadCount > 0 ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                        {contact.name || t("user_default_name", { id: contact.id })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate capitalize">
                      {contact.user_type?.toLowerCase()}
                      {unreadCount > 0 && (
                        <span className="text-blue-600 font-medium ml-1">
                          ({t("new_messages_indicator", { count: unreadCount })})
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
        <Button variant="ghost" className="w-full text-xs h-8" onClick={onViewAllClick}>
          {t("view_all_messages")}
        </Button>
      </div>
    </PopoverContent>
  </Popover>
);