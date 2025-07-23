import { MainLayout } from "@/layouts/main-layout"
import { SectionTitle, SectionSubTitle, SectionSubText } from "@/components/ui/section-title"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const ChatDashboard = () => {
    // Sample Data for previous chats
    const previousChats = [
        {
            title: "How to do a body recomp",
            description: "Sint fugiat nostrud labore elit reprehenderit officia minim excepteur nulla Lorem cillum amet laborum."
        },
        {
            title: "What is muscle hyperthrophy",
            description: "Non aute sit esse tempor nisi et tempor tempor eu anim veniam eu. Eiusmod Lorem nostrud Lorem pariatur eiusmod esse in pariatur."
        },
    ];

    return (
        <MainLayout>
            <SectionTitle>Fitness Assistant</SectionTitle>
            <SectionSubText>Get personalized recommendations</SectionSubText>

            <Button className="w-full"><Plus />New Chat</Button>

            <SectionSubTitle>Previous Chats</SectionSubTitle>

            {previousChats.map((chat, index) => (
                <ChatCard
                    key={index}
                    title={chat.title}
                    description={chat.description}
                />
            ))}
        </MainLayout>
    );
}

const ChatCard = ({ title, description }) => {
    return (
        <Card className="pt-0 pb-0 gap-0">
            <CardHeader className="px-5 py-3 pb-4 bg-primary-300 rounded-t-md place-items-start gap-0">
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardDescription className="px-5 py-3">
                {description}
            </CardDescription>
        </Card>
    );
}

export { ChatDashboard }