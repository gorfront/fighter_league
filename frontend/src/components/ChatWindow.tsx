/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from "react";
import {
  Send,
  Loader2,
  Smile,
  X,
  Ban,
  Paperclip,
  FileText,
  Video,
} from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";
import EmojiPicker from "emoji-picker-react";
import { supabase } from "@/lib/supabaseClient";

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

  useEffect(() => {
    if (myToken) connectSocket(myToken);
  }, [myToken, connectSocket]);

  useEffect(() => {
    if (targetUserId !== undefined && targetUserId !== null) {
      joinChat(targetUserId);
      setShowEmojiPicker(false);
      clearAttachment();
    }
  }, [targetUserId, joinChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoadingHistory, showEmojiPicker, previewUrl]);

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

  const clearAttachment = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileType("file");
    if (fileInputRef.current) fileInputRef.current.value = "";
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
        alert("Failed to upload file. Please try again.");
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
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full w-full border rounded-lg bg-background shadow-lg overflow-hidden relative">
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
            {isConnected ? "Online" : "Connecting..."}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950/50 custom-scroll">
        {isLoadingHistory && (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <Loader2 className="animate-spin mr-2" /> Loading history...
          </div>
        )}

        {!isLoadingHistory &&
          messages.map((msg: any) => {
            const isMe = msg.senderId === userId;
            return (
              <div
                key={msg.id}
                className={`mt-2 flex ${
                  isMe ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-white dark:bg-muted border text-foreground rounded-tl-none"
                  }`}
                >
                  {msg.attachmentUrl && (
                    <div className="mb-2">
                      {msg.attachmentType === "image" ? (
                        <a
                          href={msg.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={msg.attachmentUrl}
                            alt="attachment"
                            className="rounded-lg max-h-60 object-cover hover:opacity-90 transition-opacity"
                          />
                        </a>
                      ) : msg.attachmentType === "video" ? (
                        <div className="rounded-lg overflow-hidden bg-black/10">
                          <video
                            src={msg.attachmentUrl}
                            controls
                            className="max-h-60 w-full object-contain"
                          />
                        </div>
                      ) : (
                        <a
                          href={msg.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 p-3 rounded-lg border ${
                            isMe
                              ? "bg-primary-foreground/10 border-white/20"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <FileText size={20} className="text-black" />
                          <span className="text-sm underline break-all text-black">
                            Download File
                          </span>
                        </a>
                      )}
                    </div>
                  )}

                  {msg.content && (
                    <p className="text-sm break-words whitespace-pre-wrap text-black">
                      {msg.content}
                    </p>
                  )}

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
        <div ref={messagesEndRef} />
      </div>

      {selectedFile && (
        <div className="px-4 py-2 bg-muted/30 border-t flex items-center justify-between animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3">
            {fileType === "image" && previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-12 w-12 object-cover rounded-md border"
              />
            ) : fileType === "video" ? (
              <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-md flex items-center justify-center border border-blue-200">
                <Video size={24} />
              </div>
            ) : (
              <div className="h-12 w-12 bg-gray-200 text-gray-500 rounded-md flex items-center justify-center">
                <FileText size={24} />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium truncate max-w-[200px]">
                {selectedFile.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          </div>
          <button
            onClick={clearAttachment}
            className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="p-2 md:p-4 border-t bg-background shrink-0 pb-safe">
        {isBlocked || amIBlocked ? (
          <div className="flex items-center justify-center p-3 text-red-600 bg-red-50 rounded-xl border border-red-100 mx-4">
            <Ban size={18} className="mr-2" />
            <span className="text-sm font-medium">Messaging unavailable</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 max-w-full">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
            />

            <div className="flex items-center shrink-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-muted-foreground hover:bg-muted rounded-full"
                disabled={isUploading}
              >
                <Paperclip size={20} />
              </button>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-muted-foreground hover:bg-muted rounded-full"
              >
                {showEmojiPicker ? <X size={20} /> : <Smile size={20} />}
              </button>
            </div>

            <div className="flex-1 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedFile ? "Add a caption..." : "Message..."}
                disabled={!isConnected || isUploading}
                className="w-full pl-4 pr-4 py-2.5 bg-muted/50 focus:bg-background focus:ring-2 focus:ring-primary/10 rounded-3xl text-sm"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={
                (!inputValue.trim() && !selectedFile) ||
                !isConnected ||
                isUploading
              }
              className={`p-2.5 rounded-full shrink-0 transition-all shadow-sm ${
                (!inputValue.trim() && !selectedFile) || !isConnected
                  ? "bg-muted text-muted-foreground opacity-50"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
              }`}
            >
              {isUploading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} className={inputValue.trim() ? "ml-0.5" : ""} />
              )}
            </button>
          </div>
        )}
      </div>

      {showEmojiPicker && !isBlocked && !amIBlocked && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-20 left-4 z-10 shadow-xl border rounded-xl bg-background"
        >
          <EmojiPicker
            onEmojiClick={(d) => setInputValue((p) => p + d.emoji)}
            width={300}
            height={400}
          />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
