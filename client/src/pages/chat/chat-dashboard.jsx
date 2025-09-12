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
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Clock, Pencil, Trash2, Loader2 } from "lucide-react";

const ChatDashboard = () => {
    const navigate = useNavigate();

    // State for modals
    const [renameDialog, setRenameDialog] = useState({ open: false, chatId: null, currentTitle: '' });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, chatId: null, chatTitle: '' });
    const [newTitle, setNewTitle] = useState('');

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

    // Rename chat handlers
    const handleRenameClick = (chat) => {
        setRenameDialog({
            open: true,
            chatId: chat.id,
            currentTitle: chat.title
        });
        setNewTitle(chat.title);
    };

    const handleRenameSubmit = async () => {
        if (!newTitle.trim() || !renameDialog.chatId) return;

        try {
            await renameChat(renameDialog.chatId, newTitle.trim());
            setRenameDialog({ open: false, chatId: null, currentTitle: '' });
            setNewTitle('');
        } catch (error) {
            console.error('Error renaming chat:', error);
        }
    };

    const handleRenameCancel = () => {
        setRenameDialog({ open: false, chatId: null, currentTitle: '' });
        setNewTitle('');
    };

    // Delete chat handlers
    const handleDeleteClick = (chat) => {
        setDeleteDialog({
            open: true,
            chatId: chat.id,
            chatTitle: chat.title
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.chatId) return;

        try {
            await deleteChat(deleteDialog.chatId);
            setDeleteDialog({ open: false, chatId: null, chatTitle: '' });
        } catch (error) {
            console.error('Error deleting chat:', error);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ open: false, chatId: null, chatTitle: '' });
    };

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
                <div className="text-red-500 text-sm mt-2">
                    Error creating chat: {createChatError.message}
                </div>
            )}
            {renameChatError && (
                <div className="text-red-500 text-sm mt-2">
                    Error renaming chat: {renameChatError.message}
                </div>
            )}
            {deleteChatError && (
                <div className="text-red-500 text-sm mt-2">
                    Error deleting chat: {deleteChatError.message}
                </div>
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

            {/* Rename Dialog */}
            <Dialog open={renameDialog.open} onOpenChange={(open) => !open && handleRenameCancel()}>
                <DialogContent aria-describedby="rename-dialog-description">
                    <DialogHeader>
                        <DialogTitle>Rename Chat</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p id="rename-dialog-description" className="text-sm text-muted-foreground mb-3">
                            Enter a new title for your chat conversation.
                        </p>
                        <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Enter new chat title"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleRenameSubmit();
                                }
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleRenameCancel}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRenameSubmit}
                            disabled={isRenamingChat || !newTitle.trim()}
                        >
                            {isRenamingChat ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Rename
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && handleDeleteCancel()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Chat</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deleteDialog.chatTitle}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleDeleteCancel}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeletingChat}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeletingChat ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </MainLayout>
    );
};

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

const ChatCard = ({ chat, onClick, onRename, onDelete, isDeleting }) => {
    const menuItems = [
        {
            icon: Pencil,
            label: "Rename",
            action: (e) => {
                e?.stopPropagation?.(); // Stop event propagation
                onRename();
            }
        },
        {
            icon: Trash2,
            label: "Delete",
            action: (e) => {
                e?.stopPropagation?.(); // Stop event propagation
                onDelete();
            },
            disabled: isDeleting
        },
    ];

    const handleMenuClick = (e) => {
        e.stopPropagation(); // Prevent card click when menu is opened
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