import LoginPage from "./pages/Login-page"
import { createBrowserRouter, RouterProvider } from 'react-router'

// This is where you define routes (links to pages)
const router = createBrowserRouter([
    { path: "/", element: <LoginPage /> }
]);

const Router = () => {
    return <RouterProvider router={router} />
}

export default Router