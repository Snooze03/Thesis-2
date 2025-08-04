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


export const Router = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignupAndLogout />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="*" element={<h1>Not Found</h1>} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoutes />}>
                    <Route path="/" element={<Profile />} />
                    <Route path="/nutrition" element={<NutritionDashboard />} />
                    <Route path="/chat" element={<ChatDashboard />} />
                    <Route path="/resources" element={<ResourcesDashboard />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

function Logout() {
    localStorage.clear();
    return <Navigate to="/login" />
}

function SignupAndLogout() {
    localStorage.clear();
    // return <SignUp />;
    return <MultiStepForm />
}

function ProtectedRoutes() {
    const refreshToken = async () => {
        const refresh = localStorage.getItem(REFRESH_TOKEN);
        if (!refresh) alert("No refresh token");

        const response = await api.post("/accounts/token/refresh/", { refresh });
        const access = response.data.access;
        localStorage.setItem(ACCESS_TOKEN, access);

        return access;
    };

    const checkAuth = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) alert("No access token");

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

    if (isPending) return <div>Loading...</div>;

    return isError ? <Navigate to="/login" /> : <Outlet />;
}