import { createBrowserRouter, RouterProvider } from 'react-router'
import {
    LoginPage,
    BasicInfoPage,
    SignUpPage
} from "./pages/login-page"
import { Profile } from "@/components/profile"

// This is where you define routes (links to pages)
const router = createBrowserRouter([
    { path: "/", element: <LoginPage /> },
    { path: "/signup", element: <SignUpPage /> },
    { path: "/basicinfo", element: <BasicInfoPage /> },
    { path: "/profile", element: <Profile /> },
]);

export const Router = () => {
    return <RouterProvider router={router} />
}
