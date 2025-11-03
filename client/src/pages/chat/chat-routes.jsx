import { Route, Routes } from "react-router-dom";
import { ChatDashboard } from "./dashboard/chat-dashboard";
import { ChatConversation } from "./chat-conversation";
import { NotFound } from "@/routes";

export function ChatRoutes() {
    return (
        <Routes>
            <Route index element={<ChatDashboard />} />
            <Route path="new-chat/" element={<ChatConversation />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
