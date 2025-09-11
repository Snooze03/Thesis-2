import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api';

const QUERY_KEYS = {
    chats: ['chats'],
    chat: (id) => ['chat', id],
    messages: (chatId) => ['messages', chatId],
};

export const useChatAssistant = () => {
    const [currentChatId, setCurrentChatId] = useState(null);
    const queryClient = useQueryClient();

    const {
        data: chats = [],
        isLoading: isLoadingChats,
        error: chatsError
    } = useQuery({
        queryKey: QUERY_KEYS.chats,
        queryFn: async () => {
            const response = await api.get('/assistant/chats/');
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Get current chat from chats array
    const currentChat = chats.find(chat => chat.id === currentChatId) || null;

    // Fetch messages for current chat
    const {
        data: messages = [],
        isLoading: isLoadingMessages,
        error: messagesError
    } = useQuery({
        queryKey: QUERY_KEYS.messages(currentChatId),
        queryFn: async () => {
            if (!currentChatId) return [];
            const response = await api.get(`/assistant/chats/${currentChatId}/messages/`);
            return response.data || [];
        },
        enabled: !!currentChatId,
        staleTime: 30 * 1000, // 30 seconds
    });

    // Create new chat mutation
    const createChatMutation = useMutation({
        mutationFn: async (title = 'New Chat') => {
            const response = await api.post('/assistant/chats/', { title });
            return response.data;
        },
        onSuccess: (newChat) => {
            // Update chats cache
            queryClient.setQueryData(QUERY_KEYS.chats, (oldChats = []) => [
                newChat,
                ...oldChats
            ]);
            // Set as current chat
            setCurrentChatId(newChat.id);
            // Initialize empty messages for new chat
            queryClient.setQueryData(QUERY_KEYS.messages(newChat.id), []);
        },
        onError: (error) => {
            console.error('Failed to create chat:', error);
        }
    });

    // Send message mutation
    const sendMessageMutation = useMutation({
        mutationFn: async ({ chatId, content }) => {
            const response = await api.post(`/assistant/chats/${chatId}/send/`, {
                message: content
            });
            return response.data;
        },
        onMutate: async ({ content }) => {
            if (!currentChatId) return;

            await queryClient.cancelQueries({
                queryKey: QUERY_KEYS.messages(currentChatId)
            });

            const previousMessages = queryClient.getQueryData(
                QUERY_KEYS.messages(currentChatId)
            ) || [];

            const optimisticMessage = {
                id: `temp-${Date.now()}`,
                role: 'user',
                content: content,
                timestamp: new Date().toISOString()
            };

            queryClient.setQueryData(
                QUERY_KEYS.messages(currentChatId),
                [...previousMessages, optimisticMessage]
            );

            return { previousMessages, optimisticMessage };
        },
        onSuccess: (data) => {
            if (data.messages && currentChatId) {
                queryClient.setQueryData(
                    QUERY_KEYS.messages(currentChatId),
                    data.messages
                );
            }
        },
        onError: (error, variables, context) => {
            console.error('Failed to send message:', error);

            if (context?.previousMessages && currentChatId) {
                queryClient.setQueryData(
                    QUERY_KEYS.messages(currentChatId),
                    context.previousMessages
                );
            }
        }
    });

    // Helper functions 
    const createChat = useCallback(async (title) => {
        return new Promise((resolve, reject) => {
            createChatMutation.mutate(title, {
                onSuccess: (newChat) => {
                    resolve(newChat); // Return the created chat
                },
                onError: (error) => {
                    reject(error);
                }
            });
        });
    }, [createChatMutation]);

    const selectChat = useCallback((chatId) => {
        setCurrentChatId(chatId);
    }, []);

    const sendMessage = useCallback((content) => {
        if (!currentChatId) {
            console.error('No current chat selected');
            return;
        }
        return sendMessageMutation.mutate({ chatId: currentChatId, content });
    }, [currentChatId, sendMessageMutation]);

    const refreshChats = useCallback(() => {
        return queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chats });
    }, [queryClient]);

    return {
        // Data
        chats,
        currentChat,
        messages,

        // Loading states
        isLoading: isLoadingChats || isLoadingMessages,
        isLoadingChats,
        isLoadingMessages,
        isCreatingChat: createChatMutation.isPending,
        isSendingMessage: sendMessageMutation.isPending,

        // Error states
        chatsError,
        messagesError,
        createChatError: createChatMutation.error,
        sendMessageError: sendMessageMutation.error,

        // Actions
        createChat,
        selectChat,
        sendMessage,
        refreshChats,

        // Query utilities
        queryClient,
    };
};