import { useState, useCallback } from 'react';
import api from '@/api';

export const useChatAssistant = () => {
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadConversations = useCallback(async () => {
        try {
            const response = await api.get('/assistant/conversations/');
            setConversations(response.data);
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    }, []);

    const createConversation = useCallback(async (title = 'New Conversation') => {
        try {
            setIsLoading(true);
            const response = await api.post('/assistant/conversations/', { title });
            const newConversation = response.data;
            setConversations(prev => [newConversation, ...prev]);
            setCurrentConversation(newConversation);
            setMessages([]);
            return newConversation;
        } catch (error) {
            console.error('Failed to create conversation:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const selectConversation = useCallback(async (conversationId) => {
        try {
            setIsLoading(true);
            const conversation = conversations.find(c => c.id === conversationId);
            setCurrentConversation(conversation);

            const response = await api.get(`/assistant/conversations/${conversationId}/messages/`);
            setMessages(response.data);
        } catch (error) {
            console.error('Failed to load conversation:', error);
        } finally {
            setIsLoading(false);
        }
    }, [conversations]);

    const sendMessage = useCallback(async (content) => {
        if (!currentConversation) return;

        try {
            setIsLoading(true);
            const response = await api.post(`/assistant/conversations/${currentConversation.id}/send/`, {
                message: content
            });
            setMessages(response.data.messages);
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentConversation]);

    return {
        conversations,
        currentConversation,
        messages,
        isLoading,
        loadConversations,
        createConversation,
        selectConversation,
        sendMessage
    };
};