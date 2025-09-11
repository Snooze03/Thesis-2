"use client"

import { useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { SubLayout } from '@/layouts/sub-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionTitle } from '@/components/ui/section-title';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { useChatAssistant } from '@/hooks/useChatAssistant';

const ChatConversation = () => {
    const [inputMessage, setInputMessage] = useState('');
    const [chatLoaded, setChatLoaded] = useState(false);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    // chat id from navigation state
    const chatId = location.state?.newChatId;
    console.log(`Chat ID from state: ${chatId}`);

    const {
        currentChat,
        messages,
        isLoading,
        selectChat,
        sendMessage,
    } = useChatAssistant();

    // Debug logs
    // console.log('Current Chat:', currentChat);
    // console.log('Messages:', messages);
    // console.log('Is Loading:', isLoading);
    // console.log('Chat Loaded:', chatLoaded);

    // Load the specific chat upon component mount
    useEffect(() => {
        const loadChat = async () => {
            if (chatId) {
                try {
                    await selectChat(chatId);
                    setChatLoaded(true);
                } catch (error) {
                    console.error('Error selecting chat:', error);
                    setChatLoaded(true); // Set to true even on error to show the input
                }
            } else {
                console.log('No chatId provided');
                setChatLoaded(true);
            }
        };

        loadChat();
    }, [chatId, selectChat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || isLoading) return;

        await sendMessage(inputMessage);
        setInputMessage('');
    };

    // Show loading only if we haven't attempted to load the chat yet
    const showLoading = !chatLoaded && !currentChat;

    return (
        <SubLayout>
            <div className="flex gap-2 items-center">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft className="size-5" />
                </Button>
                <SectionTitle>Fitness Assistant</SectionTitle>
            </div>
            {/* Main Chat Area - Full Width */}
            <Card className="flex-1 flex flex-col pb-4">
                {/* <CardHeader className="pb-3">
                    <CardTitle>
                        {currentChat ? `${currentChat.title} - PrimeFit Assistant` : chatLoaded ? 'PrimeFit Assistant' : 'Loading chat...'}
                    </CardTitle>
                </CardHeader> */}

                {/* Always show the chat interface once chat is loaded, even if currentChat is null */}
                {chatLoaded || currentChat ? (
                    <>
                        {/* Messages */}
                        <CardContent className="flex-1 p-0">
                            <ScrollArea className="h-full p-4">
                                <div className="space-y-4">
                                    {messages.length === 0 && !isLoading ? (
                                        <div className="text-center text-muted-foreground py-8">
                                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>Start your conversation with PrimeFit Assistant</p>
                                        </div>
                                    ) : (
                                        messages.map((message, index) => (
                                            <div
                                                key={index}
                                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user'
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted'
                                                        }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                    <span className="text-xs opacity-70 block mt-1">
                                                        {new Date(message.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-muted p-3 rounded-lg">
                                                <LoadingSpinner className="h-4 w-4" />
                                                <span className="ml-2 text-sm">Assistant is typing...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </ScrollArea>
                        </CardContent>

                        {/* Message Input - Always show once chat is loaded */}
                        <div className="p-4 border-t pb-0">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    placeholder="Ask about workouts, nutrition, or fitness advice..."
                                    disabled={isLoading}
                                    className="flex-1"
                                />
                                <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <CardContent className="flex-1 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <LoadingSpinner className="h-8 w-8 mx-auto mb-4" />
                            <p>Loading your chat...</p>
                        </div>
                    </CardContent>
                )}
            </Card>
        </SubLayout>
    );
};

export { ChatConversation }