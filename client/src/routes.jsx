import { createBrowserRouter, RouterProvider } from 'react-router';
import { Login } from './pages/login/login-form';
import { SignUp } from './pages/sign-up/signup-form';
import { BasicInfo } from './pages/sign-up/basicInfo-form';
import { Profile } from '@/pages/profile/profile-dashboard';
import { NutritionDashboard } from "@/pages/nutrition/nutrition-dashboard";
import { ChatDashboard } from './pages/chat/chat-dashboard';
import { ResourcesDashboard } from './pages/resources/resources-dashboard';

// This is where you define routes (links to pages)
const router = createBrowserRouter([
    { path: "/", element: <Login /> },
    { path: "/signup", element: <SignUp /> },
    { path: "/basicinfo", element: <BasicInfo /> },
    { path: "/profile", element: <Profile /> },
    { path: "/nutrition", element: <NutritionDashboard /> },
    { path: "/chat", element: <ChatDashboard /> },
    { path: "/resources", element: <ResourcesDashboard /> },
]);

export const Router = () => {
    return <RouterProvider router={router} />;
}
