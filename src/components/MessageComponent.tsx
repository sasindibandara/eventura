import React, { useState, useEffect, useRef } from "react";
import { useMessages } from "../context/MessageContext";
import { Message } from "../services/messageService";

interface MessageComponentProps {
  receiverId: number;
  receiverName: string;
}

export const MessageComponent: React.FC<MessageComponentProps> = ({
  receiverId,
  receiverName,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const { messages, sendMessage, loadConversation, markAsRead } = useMessages();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversation(receiverId);
  }, [receiverId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await sendMessage(receiverId, newMessage);
    setNewMessage("");
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">Chat with {receiverName}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message: Message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender.id === receiverId ? "justify-start" : "justify-end"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender.id === receiverId
                  ? "bg-gray-100"
                  : "bg-blue-500 text-white"
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {formatTimestamp(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};
