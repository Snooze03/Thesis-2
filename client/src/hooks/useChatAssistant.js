import { useState, useCallback } from 'react';
import api from '@/api';

export const useChatAssistant = () => {
    const [chats, setChats] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadChats = useCallback(async () => {
        try {
            const response = await api.get('/assistant/chats/');
            setChats(response.data);
            return response.data;
        } catch (error) {
            console.error('Failed to load chats:', error);
            return [];
        }
    }, []);

    const createChat = useCallback(async (title = 'New Chat') => {
        try {
            setIsLoading(true);
            const response = await api.post('/assistant/chats/', { title });
            const newChat = response.data;
            setChats(prev => [newChat, ...prev]);
            setCurrentChat(newChat);
            setMessages([]);
            return newChat;
        } catch (error) {
            console.error('Failed to create chat:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const selectChat = useCallback(async (chatId) => {
        try {
            setIsLoading(true);
            // If chats array is empty, load chats first
            let availableChats = chats;
            if (chats.length === 0) {
                availableChats = await loadChats();
            }

            // Find the chat by ID
            const chat = availableChats.find(c => c.id === chatId);

            if (!chat) {
                console.error('Chat not found with ID:', chatId);
                return;
            }

            setCurrentChat(chat);

            // Load messages for this chat
            const response = await api.get(`/assistant/chats/${chatId}/messages/`);
            setMessages(response.data || []);
        } catch (error) {
            console.error('Failed to load chat:', error);
        } finally {
            setIsLoading(false);
        }
    }, [chats, loadChats]);

    const sendMessage = useCallback(async (content) => {
        if (!currentChat) {
            console.error('No current chat selected');
            return;
        }

        try {
            setIsLoading(true);

            // Add user message immediately to the UI
            const userMessage = {
                id: Date.now(), // temporary ID
                role: 'user',
                content: content,
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, userMessage]);

            const response = await api.post(`/assistant/chats/${currentChat.id}/send/`, {
                message: content
            });

            // Update with the complete messages from the server
            if (response.data.messages) {
                setMessages(response.data.messages);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            // Remove the optimistically added message on error
            setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
        } finally {
            setIsLoading(false);
        }
    }, [currentChat]);

    return {
        chats,
        currentChat,
        messages,
        isLoading,
        loadChats,
        createChat,
        selectChat,
        sendMessage
    };
};