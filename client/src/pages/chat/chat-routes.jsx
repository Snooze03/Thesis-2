import { Route, Routes } from "react-router-dom";
import { ChatDashboard } from "./chat-dashboard";
import { ChatConversation } from "./chat-conversation";
import { NotFound } from "@/routes";

export function ChatRoutes() {
    return (
        <Routes>
            <Route index element={<ChatDashboard />} />
            <Route path="conversation/" element={<ChatConversation />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
