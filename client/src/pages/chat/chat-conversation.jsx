import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Send, Plus, MessageSquare } from 'lucide-react';
import { useChatAssistant } from '@/hooks/useChatAssistant';

const ChatConversation = () => {
    const {
        conversations,
        currentConversation,
        messages,
        isLoading,
        createConversation,
        selectConversation,
        sendMessage,
        loadConversations
    } = useChatAssistant();

    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || isLoading) return;

        await sendMessage(inputMessage);
        setInputMessage('');
    };

    const handleNewConversation = async () => {
        await createConversation('New Chat');
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
            {/* Sidebar - Conversations */}
            <Card className="w-80 flex flex-col">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Conversations</CardTitle>
                        <Button onClick={handleNewConversation} size="sm" variant="outline">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-full">
                        <div className="space-y-2 p-3">
                            {conversations.map((conversation) => (
                                <div
                                    key={conversation.id}
                                    onClick={() => selectConversation(conversation.id)}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors ${currentConversation?.id === conversation.id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-muted'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        <span className="truncate text-sm">{conversation.title}</span>
                                    </div>
                                    <span className="text-xs opacity-70">
                                        {new Date(conversation.updated_at).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Main Chat Area */}
            <Card className="flex-1 flex flex-col">
                <CardHeader className="pb-3">
                    <CardTitle>
                        {currentConversation ? 'PrimeFit Assistant' : 'Select a conversation or start a new one'}
                    </CardTitle>
                </CardHeader>

                {currentConversation ? (
                    <>
                        {/* Messages */}
                        <CardContent className="flex-1 p-0">
                            <ScrollArea className="h-full p-4">
                                <div className="space-y-4">
                                    {messages.map((message, index) => (
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
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-muted p-3 rounded-lg">
                                                <LoadingSpinner className="h-4 w-4" />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </ScrollArea>
                        </CardContent>

                        {/* Message Input */}
                        <div className="p-4 border-t">
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
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Start a conversation with your fitness assistant</p>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
};

export { ChatConversation }