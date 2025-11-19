import { useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { SubLayout } from '@/layouts/sub-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionTitle } from '@/components/ui/section-title';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { useChatAssistant } from '@/hooks/assistant/useChatAssistant';
import { Dumbbell } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';

const ChatConversation = () => {
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Get chat ID from navigation state or URL params
    const chatId = location.state?.chatId || location.state?.newChatId;

    const {
        currentChat,
        messages,
        isLoadingMessages,
        isSendingMessage,
        selectChat,
        sendMessage,
        messagesError,
        sendMessageError,
        refreshChats,
    } = useChatAssistant();

    // Load the specific chat upon component mount
    useEffect(() => {
        if (chatId) {
            selectChat(chatId);
        } else {
            console.log('No chatId provided, currentChat:', currentChat);
        }
    }, [chatId, selectChat, currentChat]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || isSendingMessage || !currentChat) return;

        try {
            await sendMessage(inputMessage);
            setInputMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleBackClick = async () => {
        // Refresh chats to update last_message before navigating back
        await refreshChats();
        navigate('/chat');
    };

    // Show error state
    if (messagesError) {
        return (
            <SubLayout>
                <div className="flex gap-2 items-center mb-4">
                    <Button variant="ghost" onClick={handleBackClick}>
                        <ArrowLeft className="size-5" />
                    </Button>
                    <SectionTitle>Fitness Assistant</SectionTitle>
                </div>
                <Card className="flex-1 flex items-center justify-center">
                    <CardContent className="text-center">
                        <p className="text-red-500 mb-4">Error loading messages: {messagesError.message}</p>
                        <Button onClick={() => window.location.reload()}>Retry</Button>
                    </CardContent>
                </Card>
            </SubLayout>
        );
    }

    return (
        <SubLayout>
            {/* Fixed header outside the main container */}
            <div className="flex gap-2 items-center mb-4">
                <Button variant="ghost" onClick={handleBackClick}>
                    <ArrowLeft className="size-5" />
                </Button>
                <SectionTitle>
                    {currentChat ? currentChat.title : 'Fitness Assistant'}
                </SectionTitle>
            </div>

            {/* Main container with fixed height calculation */}
            <div className="h-auto flex flex-col">
                <Card className="h-[85vh] flex flex-col pt-0 pb-1 gap-0">
                    {/* Fixed header */}
                    <CardHeader className="grid grid-cols-[min-content_auto] items-center gap-3 pt-4 pb-1 border-b-2">
                        <div className="bg-primary rounded-full self-center">
                            <Dumbbell className="size-5 m-2 stroke-white self-center justify-self-center" />
                        </div>
                        <div>
                            <p>Jim Bro</p>
                            <p className="text-sm text-gray-700">Your personal fitness assistant</p>
                        </div>
                    </CardHeader>

                    {/* Scrollable messages area */}
                    <CardContent className="flex-1 p-0 overflow-hidden">
                        <ScrollArea className="h-full pt-0">
                            <div className="p-4 space-y-4">
                                {isLoadingMessages ? (
                                    <div className="flex justify-center py-8">
                                        <LoadingSpinner className="h-8 w-8" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-[50vh]  text-muted-foreground py-8">
                                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Start your conversation with PrimeFit Assistant</p>
                                        <p className="text-sm mt-2">Ask about workouts, nutrition, or fitness advice!</p>
                                    </div>
                                ) : (
                                    messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted'
                                                    }`}
                                            >
                                                {/* Render markdown for assistant messages, plain text for user messages */}
                                                {message.role === 'assistant' ? (
                                                    <MarkdownRenderer
                                                        content={message.content}
                                                        className="text-sm"
                                                    />
                                                ) : (
                                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                )}

                                                <span className="text-xs opacity-70 block mt-1">
                                                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}

                                {/* Typing indicator */}
                                {isSendingMessage && (
                                    <div className="flex justify-start">
                                        <div className="bg-muted p-3 rounded-lg flex items-center">
                                            <LoadingSpinner className="h-4 w-4 mr-2" />
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>
                    </CardContent>

                    {/* Fixed input area */}
                    <div className="p-4 border-t flex-shrink-0">
                        {sendMessageError && (
                            <div className="text-red-500 text-sm mb-2">
                                Error sending message: {sendMessageError.message}
                            </div>
                        )}
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <Input
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="Ask about workouts, nutrition, or fitness advice..."
                                disabled={isSendingMessage || !currentChat}
                                className="flex-1"
                            />
                            <Button
                                type="submit"
                                disabled={isSendingMessage || !inputMessage.trim() || !currentChat}
                            >
                                <Send size="4" />
                            </Button>
                        </form>
                    </div>
                </Card>
            </div>
        </SubLayout>
    );
};

export { ChatConversation };