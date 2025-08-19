import { Route, Routes } from "react-router-dom";
import { Profile } from "./profile-dashboard";
import { NotFound } from "@/routes";

export function ProfileRoutes() {
    return (
        <Routes>
            <Route index element={<Profile />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
