"use client"

import { useState } from "react";
import { useChatAssistant } from "@/hooks/useChatAssistant";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/layouts/main-layout";
import { SectionTitle, SectionSubTitle, SectionSubText } from "@/components/ui/section-title";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyItems } from "@/components/empty-items";
import { Button } from "@/components/ui/button";
import { KebabMenu } from "@/components/ui/kebab-menu";
import { ChatDialogs } from "./chat-dialogs";
import { Plus, Clock, Pencil, Trash2, Loader2 } from "lucide-react";

const ChatDashboard = () => {
    const navigate = useNavigate();

    // State for modals
    const [renameDialog, setRenameDialog] = useState({ open: false, chatId: null, currentTitle: '' });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, chatId: null, chatTitle: '' });

    const {
        chats,
        createChat,
        renameChat,
        deleteChat,
        isLoadingChats,
        isCreatingChat,
        isRenamingChat,
        isDeletingChat,
        chatsError,
        createChatError,
        renameChatError,
        deleteChatError,
    } = useChatAssistant();

    const handleNewChat = async () => {
        try {
            const newChat = await createChat("New Chat");
            console.log(`New Chat created:`, newChat);
            navigate('/chat/new-chat', { state: { newChatId: newChat.id } });
        } catch (error) {
            console.error('Error creating chat:', error);
        }
    };

    const handleChatClick = (chatId) => {
        navigate('/chat/new-chat', { state: { chatId } });
    };

    // Dialog handlers
    const handleRenameClick = (chat) => {
        setRenameDialog({
            open: true,
            chatId: chat.id,
            currentTitle: chat.title
        });
    };

    const handleDeleteClick = (chat) => {
        setDeleteDialog({
            open: true,
            chatId: chat.id,
            chatTitle: chat.title
        });
    };

    // Error display component
    const ErrorDisplay = ({ error, title, onRetry }) => (
        <div className="text-red-500 text-sm mt-2">
            {title}: {error.message}
            {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry} className="ml-2">
                    Retry
                </Button>
            )}
        </div>
    );

    if (chatsError) {
        return (
            <MainLayout>
                <div className="text-center py-8">
                    <p className="text-red-500">Error loading chats: {chatsError.message}</p>
                    <Button onClick={() => window.location.reload()} className="mt-4">
                        Retry
                    </Button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <SectionTitle>Fitness Assistant</SectionTitle>
            <SectionSubText>Get personalized recommendations</SectionSubText>

            <Button
                className="w-full"
                onClick={handleNewChat}
                disabled={isCreatingChat}
            >
                {isCreatingChat ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Plus className="mr-2 h-4 w-4" />
                )}
                New Chat
            </Button>

            {/* Error messages */}
            {createChatError && (
                <ErrorDisplay
                    error={createChatError}
                    title="Error creating chat"
                    onRetry={handleNewChat}
                />
            )}
            {renameChatError && (
                <ErrorDisplay error={renameChatError} title="Error renaming chat" />
            )}
            {deleteChatError && (
                <ErrorDisplay error={deleteChatError} title="Error deleting chat" />
            )}

            <div className="flex justify-between gap-3">
                <SectionSubTitle>Previous Chats</SectionSubTitle>
                <div className="text-gray-500">
                    {isLoadingChats ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        `${chats.length} chats`
                    )}
                </div>
            </div>

            {isLoadingChats ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : chats.length === 0 ? (
                <EmptyItems
                    title="No chats yet"
                    description="Start a new chat to get personalized fitness recommendations."
                />
            ) : (
                <div className="space-y-4">
                    {chats.map((chat) => (
                        <ChatCard
                            key={chat.id}
                            chat={chat}
                            onClick={() => handleChatClick(chat.id)}
                            onRename={() => handleRenameClick(chat)}
                            onDelete={() => handleDeleteClick(chat)}
                            isDeleting={isDeletingChat}
                        />
                    ))}
                </div>
            )}

            {/* Dialogs */}
            <ChatDialogs
                renameDialog={renameDialog}
                deleteDialog={deleteDialog}
                onRenameDialogChange={setRenameDialog}
                onDeleteDialogChange={setDeleteDialog}
                onRenameSubmit={renameChat}
                onDeleteConfirm={deleteChat}
                isRenamingChat={isRenamingChat}
                isDeletingChat={isDeletingChat}
            />
        </MainLayout>
    );
};

/**
 * Utility function to format time ago
 */
const getTimeAgo = (dateString) => {
    const now = new Date();
    const updatedAt = new Date(dateString);
    const diffInMs = now - updatedAt;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

    return updatedAt.toLocaleDateString();
};

/**
 * Individual chat card component
 */
const ChatCard = ({ chat, onClick, onRename, onDelete, isDeleting }) => {
    const menuItems = [
        {
            icon: Pencil,
            label: "Rename",
            action: (e) => {
                e?.stopPropagation?.();
                onRename();
            }
        },
        {
            icon: Trash2,
            label: "Delete",
            action: (e) => {
                e?.stopPropagation?.();
                onDelete();
            },
            disabled: isDeleting
        },
    ];

    const handleMenuClick = (e) => {
        e.stopPropagation();
    };

    return (
        <Card
            className="py-5 hover:shadow-lg transition-shadow delay-50 duration-200 ease-in-out cursor-pointer"
            onClick={onClick}
        >
            <CardHeader className="px-6 -mb-5 flex items-center justify-between">
                <CardTitle>{chat.title}</CardTitle>
                <div onClick={handleMenuClick}>
                    <KebabMenu
                        items={menuItems}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </CardHeader>
            <CardContent className="-mb-4">
                <p className="text-gray-700">
                    {chat.last_message?.content || "No messages yet"}
                </p>
            </CardContent>
            <CardFooter>
                <p className="text-gray-700 text-xs">
                    <Clock className="inline size-3 mr-2" />
                    {getTimeAgo(chat.updated_at)}
                </p>
            </CardFooter>
        </Card>
    );
};

export { ChatDashboard };