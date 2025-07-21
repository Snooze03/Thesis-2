import { createBrowserRouter, RouterProvider } from 'react-router';
import { LoginPage, BasicInfoPage, SignUpPage } from "@/pages/login-page";
import { Profile } from '@/pages/profile/profile-dashboard';
import { NutritionDashboard } from "@/pages/nutrition/nutrition-dashboard";
import { ChatDashboard } from './pages/chat/chat-dashboard';

// This is where you define routes (links to pages)
const router = createBrowserRouter([
    { path: "/", element: <LoginPage /> },
    { path: "/signup", element: <SignUpPage /> },
    { path: "/basicinfo", element: <BasicInfoPage /> },
    { path: "/profile", element: <Profile /> },
    { path: "/nutrition", element: <NutritionDashboard /> },
    { path: "/chat", element: <ChatDashboard /> },
]);

export const Router = () => {
    return <RouterProvider router={router} />;
}
