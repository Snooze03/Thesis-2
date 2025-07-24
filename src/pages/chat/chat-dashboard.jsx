import { MainLayout } from "@/layouts/main-layout"
import { SectionTitle, SectionSubTitle, SectionSubText } from "@/components/ui/section-title"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Clock } from "lucide-react";

const ChatDashboard = () => {
    // Sample Data for previous chats
    const previousChats = [
        {
            title: "How to do a body recomp",
            description: "Sint fugiat nostrud labore elit reprehenderit officia minim excepteur nulla Lorem cillum amet laborum.",
            tags: "training"
        },
        {
            title: "What is muscle hyperthrophy",
            description: "Non aute sit esse tempor nisi et tempor tempor eu anim veniam eu. Eiusmod Lorem nostrud Lorem pariatur eiusmod esse in pariatur.",
            tags: "training"
        },
        {
            title: "How to diet correctly is muscle hyperthrophy",
            description: "Non aute sit esse tempor nisi et tempor tempor eu anim veniam eu. Eiusmod Lorem nostrud Lorem pariatur eiusmod esse in pariatur.",
            tags: "nutrition"
        },
    ];

    return (
        <MainLayout>
            <SectionTitle>Fitness Assistant</SectionTitle>
            <SectionSubText>Get personalized recommendations</SectionSubText>

            <Button className="w-full"><Plus />New Chat</Button>

            <div className="flex justify-between gap-3">
                <SectionSubTitle>Previous Chats</SectionSubTitle>
                <p className="text-gray-500">2 conversations</p>
            </div>

            {previousChats.map((chat, index) => (
                <ChatCard
                    key={index}
                    title={chat.title}
                    description={chat.description}
                    badge={chat.tags}
                />
            ))}
        </MainLayout>
    );
}

const ChatCard = ({ title, description, badge }) => {
    return (
        <Card className="py-5 hover:shadow-lg transition-shadow delay-50 duration-200 ease-in-out">
            <CardHeader className="px-6 -mb-5">
                <div className="flex items-center gap-3 flex-wrap">
                    <CardTitle>{title}</CardTitle>
                    <Badge variant="secondary">{badge}</Badge>
                </div>
            </CardHeader>
            <CardContent className="-mb-4">
                <p className="text-gray-700">
                    {description}
                </p>
            </CardContent>
            <CardFooter>
                <p className="text-gray-700 text-xs">
                    <Clock className="inline size-3 mr-2" />
                    2 days ago
                </p>
            </CardFooter>
        </Card>
    );
}

export { ChatDashboard }