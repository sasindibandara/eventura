import React, { createContext, useContext, useState, useEffect } from "react";
import { Message, messageService } from "../services/messageService";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

interface MessageContextType {
  messages: Message[];
  unreadCount: number;
  sendMessage: (receiverId: number, content: string) => Promise<void>;
  loadConversation: (userId: number) => Promise<void>;
  markAsRead: (messageId: number) => Promise<void>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      onConnect: () => {
        console.log("Connected to WebSocket");
        if (currentUserId) {
          client.subscribe(`/topic/user/${currentUserId}`, (message) => {
            const newMessage = JSON.parse(message.body);
            setMessages((prev) => [...prev, newMessage]);
            setUnreadCount((prev) => prev + 1);
          });
        }
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, [currentUserId]);

  const sendMessage = async (receiverId: number, content: string) => {
    if (!currentUserId) return;

    const message = await messageService.sendMessage(
      currentUserId,
      receiverId,
      content
    );
    setMessages((prev) => [...prev, message]);

    if (stompClient?.connected) {
      stompClient.publish({
        destination: `/app/message/${receiverId}`,
        body: JSON.stringify(message),
      });
    }
  };

  const loadConversation = async (userId: number) => {
    if (!currentUserId) return;
    const conversation = await messageService.getConversation(
      currentUserId,
      userId
    );
    setMessages(conversation);
  };

  const markAsRead = async (messageId: number) => {
    await messageService.markAsRead(messageId);
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <MessageContext.Provider
      value={{
        messages,
        unreadCount,
        sendMessage,
        loadConversation,
        markAsRead,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error("useMessages must be used within a MessageProvider");
  }
  return context;
};
