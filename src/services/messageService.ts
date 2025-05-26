import axios from 'axios';

const API_URL = 'https://ooadbackend-production.up.railway.app/api/messages';

export interface Message {
    id: number;
    sender: {
        id: number;
        username: string;
    };
    receiver: {
        id: number;
        username: string;
    };
    content: string;
    timestamp: string;
    read: boolean;
}

export const messageService = {
    async sendMessage(senderId: number, receiverId: number, content: string): Promise<Message> {
        const response = await axios.post(`${API_URL}/send`, null, {
            params: { senderId, receiverId, content }
        });
        return response.data;
    },

    async getConversation(user1Id: number, user2Id: number): Promise<Message[]> {
        const response = await axios.get(`${API_URL}/conversation`, {
            params: { user1Id, user2Id }
        });
        return response.data;
    },

    async getUnreadMessages(userId: number): Promise<Message[]> {
        const response = await axios.get(`${API_URL}/unread`, {
            params: { userId }
        });
        return response.data;
    },

    async markAsRead(messageId: number): Promise<void> {
        await axios.put(`${API_URL}/${messageId}/read`);
    }
}; 
