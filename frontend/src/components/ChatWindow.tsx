/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from "react";
import { Send, Loader2, Smile, X, Ban } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";

const ChatWindow = ({
  targetUserId,
  myToken,
}: {
  targetUserId: number;
  myToken: string;
}) => {
  const {
    connectSocket,
    joinChat,
    sendMessage,
    messages,
    isConnected,
    isLoadingHistory,
    userId,
    contacts,
  } = useChatStore();

  const [inputValue, setInputValue] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const currentContact = contacts.find((c) => c.id === targetUserId);

  const isBlocked = (currentContact as any)?.isBlocked;
  const amIBlocked = (currentContact as any)?.amIBlocked;

  useEffect(() => {
    if (myToken) connectSocket(myToken);
  }, [myToken, connectSocket]);

  useEffect(() => {
    if (targetUserId) {
      joinChat(targetUserId);
      setShowEmojiPicker(false);
    }
  }, [targetUserId, joinChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoadingHistory, showEmojiPicker]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue("");
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setInputValue((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="flex flex-col h-full w-full border rounded-lg bg-background shadow-lg overflow-hidden relative">
      {/* Header */}
      <div className="p-4 border-b bg-muted/50 flex justify-between items-center shrink-0">
        <div>
          <h3 className="font-semibold">
            {currentContact?.name || `Chat with User #${targetUserId}`}
          </h3>
          <span
            className={`text-xs flex items-center gap-1 ${
              isConnected ? "text-green-600" : "text-amber-600"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-green-600" : "bg-amber-600"
              }`}
            ></span>
            {isConnected ? "Online" : "Socket Connecting..."}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950/50 custom-scroll">
        {isLoadingHistory && (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <Loader2 className="animate-spin mr-2" /> Loading history...
          </div>
        )}

        {!isLoadingHistory && messages.length === 0 && (
          <div className="flex justify-center items-center h-full text-muted-foreground opacity-50">
            No messages yet. Say hello!
          </div>
        )}

        {!isLoadingHistory &&
          messages.map((msg) => {
            const isMe = msg.senderId === userId;
            return (
              <div
                key={msg.id}
                className={`mt-1 flex ${
                  isMe ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-white dark:bg-muted border text-foreground rounded-tl-none"
                  }`}
                >
                  <p className="text-sm text-gray-900 break-words whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  <span
                    className={`text-[10px] block text-right mt-1 ${
                      isMe
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })}

        {(isBlocked || amIBlocked) && (
          <div className="flex justify-center my-4">
            <div className="bg-red-100 text-red-600 text-xs px-3 py-1 rounded-full flex items-center">
              <Ban className="w-3 h-3 mr-1" />
              {isBlocked
                ? "You blocked this user"
                : "You have been blocked by this user"}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {showEmojiPicker && !isBlocked && !amIBlocked && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-20 left-4 z-10 shadow-xl border rounded-xl bg-background"
        >
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            theme={Theme.AUTO}
            searchDisabled={false}
            skinTonesDisabled
            width={300}
            height={400}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}

      <div className="p-4 border-t bg-background shrink-0">
        {isBlocked || amIBlocked ? (
          <div className="flex items-center justify-center p-2 text-red-600 bg-red-50 rounded-lg border border-red-100">
            <Ban size={20} className="mr-2" />
            <span className="text-sm font-medium">
              {isBlocked
                ? "You have blocked this user. Unblock to send messages."
                : "You have been blocked by this user."}
            </span>
          </div>
        ) : (
          <div className="flex gap-2 items-end">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2.5 rounded-full transition-colors ${
                showEmojiPicker
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
              title="Add emoji"
            >
              {showEmojiPicker ? <X size={20} /> : <Smile size={20} />}
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={!isConnected}
              className="flex-1 px-4 py-2 text-sm text-gray-700 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || !isConnected}
              className="p-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
