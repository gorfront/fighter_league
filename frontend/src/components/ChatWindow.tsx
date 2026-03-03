/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Send,
  Loader2,
  Smile,
  X,
  Ban,
  Paperclip,
  FileText,
  Video,
  ChevronLeft,
  Download,
} from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";

const ChatWindow = ({
  targetUserId,
  myToken,
  onBack,
}: {
  targetUserId: number;
  myToken: string;
  onBack: () => void;
}) => {
  const { t } = useTranslation();
  const {
    connectSocket,
    joinChat,
    leaveChat,
    sendMessage,
    messages,
    isConnected,
    isLoadingHistory,
    userId,
    contacts,
  } = useChatStore();

  const [inputValue, setInputValue] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"image" | "video" | "file">("file");
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const currentContact = contacts.find((c) => c.id === targetUserId);
  const isBlocked = (currentContact as any)?.isBlocked;
  const amIBlocked = (currentContact as any)?.amIBlocked;

  const clearAttachment = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl && fileType === "image") URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileType("file");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [previewUrl, fileType]);

  useEffect(() => {
    if (myToken) connectSocket(myToken);
  }, [myToken, connectSocket]);

  useEffect(() => {
    if (targetUserId) {
      joinChat(targetUserId);
      setShowEmojiPicker(false);
      clearAttachment();
    }
    return () => {
      leaveChat();
    };
  }, [targetUserId, joinChat, clearAttachment]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoadingHistory, showEmojiPicker, previewUrl]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      if (file.type.startsWith("image/")) {
        setFileType("image");
        setPreviewUrl(URL.createObjectURL(file));
      } else if (file.type.startsWith("video/")) {
        setFileType("video");
        setPreviewUrl(null);
      } else {
        setFileType("file");
        setPreviewUrl(null);
      }
    }
  };


  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      return null;
    }
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && !selectedFile) || isUploading) return;
    let attachmentUrl = null;
    let attachmentType = null;
    if (selectedFile) {
      setIsUploading(true);
      attachmentUrl = await uploadFile(selectedFile);
      if (!attachmentUrl) {
        setIsUploading(false);
        alert(t("chat_upload_failed"));
        return;
      }
      if (selectedFile.type.startsWith("image/")) attachmentType = "image";
      else if (selectedFile.type.startsWith("video/")) attachmentType = "video";
      else attachmentType = "file";
      setIsUploading(false);
    }
    sendMessage(inputValue, attachmentUrl, attachmentType);
    setInputValue("");
    setShowEmojiPicker(false);
    clearAttachment();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 relative">
      <div className="h-16 px-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900 shrink-0 z-10 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden -ml-2 text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={onBack}
        >
          <ChevronLeft size={24} />
        </Button>

        <Avatar className="h-9 w-9 border border-slate-700 cursor-pointer">
          <AvatarImage src={currentContact?.avatar} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
            {currentContact?.name?.substring(0, 2).toUpperCase() || "??"}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col justify-center">
          <h3 className="font-semibold text-sm text-slate-100 leading-tight">
            {currentContact?.name || t("user_default_name", { id: targetUserId })}
          </h3>
          <span
            className={`text-[10px] flex items-center gap-1.5 ${isConnected ? "text-green-500 font-medium" : "text-slate-500"
              }`}
          >
            {isConnected ? t("chat_active_now") : t("chat_offline")}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-950/50 space-y-4 custom-scroll scroll-smooth min-h-0">
        {isLoadingHistory ? (
          <div className="flex justify-center items-center h-full flex-col gap-2 text-slate-500">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="text-xs">{t("chat_loading")}</span>
          </div>
        ) : (
          messages.map((msg: any) => {
            const isMe = msg.senderId === userId;
            return (
              <div
                key={msg.id}
                className={`flex w-full ${isMe ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`relative max-w-[80%] md:max-w-[70%] rounded-2xl p-3 shadow-sm text-sm ${isMe
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm"
                    }`}
                >
                  {msg.attachmentUrl && (
                    <div className="mb-2 rounded-lg overflow-hidden border border-white/10">
                      {msg.attachmentType === "image" ? (
                        <a
                          href={msg.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={msg.attachmentUrl}
                            alt={t("chat_attachment_alt")}
                            className="max-h-64 w-full object-cover"
                          />
                        </a>
                      ) : msg.attachmentType === "video" ? (
                        <video
                          src={msg.attachmentUrl}
                          controls
                          className="max-h-64 w-full bg-black"
                        />
                      ) : (
                        <a
                          href={msg.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 bg-slate-700/50 rounded border border-slate-600 text-slate-200 hover:bg-slate-700 transition-colors"
                        >
                          <FileText size={16} /> <span>{t("chat_download")}</span>{" "}
                          <Download size={14} />
                        </a>
                      )}
                    </div>
                  )}

                  {msg.content && (
                    <p
                      className={`whitespace-pre-wrap break-words ${!isMe && "text-slate-200"
                        }`}
                    >
                      {msg.content}
                    </p>
                  )}

                  <div
                    className={`text-[10px] text-right mt-1 ${isMe ? "text-primary-foreground/70" : "text-slate-500"
                      }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-2 md:p-4 bg-slate-900 border-t border-slate-800 shrink-0 relative z-20 pb-safe">
        {selectedFile && (
          <div className="absolute bottom-full left-0 w-full p-2 bg-slate-900 border-t border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-300 overflow-hidden">
              <Paperclip size={16} className="shrink-0" />
              <span className="truncate max-w-[200px]">
                {selectedFile.name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearAttachment}
              className="h-6 w-6 text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
            >
              <X size={14} />
            </Button>
          </div>
        )}

        {isBlocked || amIBlocked ? (
          <div className="p-3 text-center text-red-400 bg-red-900/10 rounded-lg text-sm border border-red-900/20">
            <Ban size={16} className="inline mr-2" /> {t("chat_unavailable")}
          </div>
        ) : (
          <div className="flex items-center gap-1 md:gap-2 bg-slate-800 p-1 md:p-1.5 rounded-[26px] border border-slate-700">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
            />

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8 md:h-9 md:w-9 text-slate-400 hover:text-white hover:bg-slate-700 shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={18} className="md:w-5 md:h-5" />
            </Button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("chat_placeholder")}
              className="flex-1 bg-transparent border-none focus:outline-none h-[40px] px-2 text-sm text-slate-200 placeholder:text-slate-500 min-w-0"
              disabled={!isConnected || isUploading}
            />

            <div className="relative shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 md:h-9 md:w-9 text-slate-400 hover:text-white hover:bg-slate-700"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile size={18} className="md:w-5 md:h-5" />
              </Button>

              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="
                    fixed bottom-[70px] right-2 z-50 
                    w-[calc(100vw-16px)] max-w-[320px]
                    shadow-2xl rounded-xl overflow-hidden border border-slate-700 
                    md:absolute md:bottom-12 md:right-0 md:w-[320px]
                  "
                >
                  <EmojiPicker
                    onEmojiClick={(d) => setInputValue((p) => p + d.emoji)}
                    width="100%"
                    height={320}
                    theme={Theme.DARK}
                    previewConfig={{ showPreview: false }}
                    searchDisabled={false}
                    lazyLoadEmojis={true}
                  />
                </div>
              )}
            </div>

            <Button
              onClick={handleSend}
              disabled={(!inputValue.trim() && !selectedFile) || !isConnected}
              size="icon"
              className="rounded-full h-8 w-8 md:h-10 md:w-10 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            >
              {isUploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} className="ml-0.5 md:w-[18px] md:h-[18px]" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
