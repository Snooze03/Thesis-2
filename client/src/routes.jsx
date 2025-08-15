import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ACCESS_TOKEN, REFRESH_TOKEN } from './constants';
import { jwtDecode } from 'jwt-decode';
import { useQuery } from '@tanstack/react-query';
import api from './api';
import { Login } from './pages/login/login-form';
import { MultiStepForm } from './pages/sign-up/multi-step-form';
import { Profile } from '@/pages/profile/profile-dashboard';
import { NutritionDashboard } from "@/pages/nutrition/nutrition-dashboard";
import { ChatDashboard } from './pages/chat/chat-dashboard';
import { ResourcesDashboard } from './pages/resources/resources-dashboard';

import { WorkoutsRoutes } from './pages/workouts/workouts-routes';
import { LoadingSpinner } from './components/ui/loading-spinner';


export const Router = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignupAndLogout />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="*" element={<NotFound />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoutes />}>
                    <Route path="/" element={<Profile />} />
                    <Route path="/nutrition" element={<NutritionDashboard />} />
                    <Route path="/chat" element={<ChatDashboard />} />
                    <Route path="/workouts/*" element={<WorkoutsRoutes />} />
                    <Route path="/resources" element={<ResourcesDashboard />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

function NotFound() {
    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center">
            <h1 className="text-7xl font-bold">404</h1>
            <p>The page you were looking for does not exist</p>
        </div>
    );
}

function Logout() {
    localStorage.clear();
    return <Navigate to="/login" />
}

function SignupAndLogout() {
    localStorage.clear();
    return <MultiStepForm />
}

// Authenticator
function ProtectedRoutes() {
    const refreshToken = async () => {
        const refresh = localStorage.getItem(REFRESH_TOKEN);
        if (!refresh) alert("No refresh token");

        const response = await api.post("/accounts/token/refresh/", { refresh });
        const access = response.data.access;
        localStorage.setItem(ACCESS_TOKEN, access);

        return access;
    };

    // Checks if user has access token, if true, refresh it
    const checkAuth = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN);

        const decoded = jwtDecode(token);
        const isExpired = decoded.exp < Date.now() / 1000;

        if (isExpired) {
            return await refreshToken();
        }

        return token;
    };

    const { isPending, isError } = useQuery({
        queryKey: ["auth"],
        queryFn: checkAuth,
        retry: false,
        staleTime: 5 * 60 * 1000,
    });

    if (isPending) return <LoadingSpinner message="Page" />

    return isError ? <Navigate to="/login" /> : <Outlet />;
}