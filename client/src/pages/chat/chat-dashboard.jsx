"use client"

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useChatAssistant } from "@/hooks/useChatAssistant";
import api from "@/api";
import { MainLayout } from "@/layouts/main-layout";
import { SectionTitle, SectionSubTitle, SectionSubText } from "@/components/ui/section-title";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyItems } from "@/components/empty-items";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KebabMenu } from "@/components/ui/kebab-menu";
import { Plus, Clock, Pencil, Trash2 } from "lucide-react";

const ChatDashboard = () => {
    const navigate = useNavigate();

    const {
        chats,
        createChat,
        selectChat,
    } = useChatAssistant();

    // Fetch previous chats of the user
    const {
        data: chat = [],
        isPending,
    } = useQuery({
        queryKey: ["get-chats"],
        queryFn: async () => {
            const response = await api.get("/assistant/chats/");
            return response.data;
        }
    })

    const handleNewChat = async () => {
        try {
            const newChat = await createChat("New Chat");
            console.log(`New Chat ID: ${newChat.id}`);
            navigate('/chat/new-chat', { state: { newChatId: newChat.id } })
        }
        catch (error) {
            console.log(`Error creating chat: ${error}`);
        }
    }

    return (
        <MainLayout>
            <SectionTitle>Fitness Assistant</SectionTitle>
            <SectionSubText>Get personalized recommendations</SectionSubText>

            <Button className="w-full" onClick={handleNewChat}><Plus />New Chat</Button>

            <div className="flex justify-between gap-3">
                <SectionSubTitle>Previous Chats</SectionSubTitle>
                <p className="text-gray-500">{chat.length} chats</p>
            </div>

            {chat.length === 0 && (
                <EmptyItems title="No chats yet" description="Start a new chat to get personalized fitness recommendations." />
            )}

            {chat.map((chat, index) => (
                <ChatCard
                    key={index}
                    title={chat.title}
                // lastMessage={chat.last_message.content}
                // updatedAt={chat.updated_at}
                // description={chat.description}
                // badge={chat.tags}
                />
            ))}
        </MainLayout>
    );
}

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

const ChatCard = ({ title, lastMessage, badge, updatedAt }) => {
    const menuItems = [
        { icon: Pencil, label: "Rename", action: () => console.log("test") },
        { icon: Trash2, label: "Delete", action: () => console.log("te") },
        // { type: "separator" },
        // { icon: LogOut, label: "Logout", action: () => navigate("/logout"), variant: "destructive" },
    ]

    return (
        <Card className="py-5 hover:shadow-lg transition-shadow delay-50 duration-200 ease-in-out">
            <CardHeader className="px-6 -mb-5 flex items-center justify-between">
                {/* <div className="flex items-center gap-3 flex-wrap"> */}
                <CardTitle>{title}</CardTitle>
                {/* <Badge variant="secondary">{badge}</Badge> */}
                {/* </div> */}
                <KebabMenu items={menuItems} />
            </CardHeader>
            <CardContent className="-mb-4">
                <p className="text-gray-700">
                    {lastMessage}
                </p>
            </CardContent>
            <CardFooter>
                <p className="text-gray-700 text-xs">
                    <Clock className="inline size-3 mr-2" />
                    {getTimeAgo(updatedAt)}
                </p>
            </CardFooter>
        </Card>
    );
}

export { ChatDashboard }