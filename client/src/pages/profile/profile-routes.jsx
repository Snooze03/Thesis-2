import { Route, Routes } from "react-router-dom";
import { Profile } from "./profile-dashboard";
import { ProfileSettings } from "./profile-settings";
import { ProfileEdit } from "./profile-edit";
import { NotFound } from "@/routes";

export function ProfileRoutes() {
    return (
        <Routes>
            <Route index element={<Profile />} />
            <Route path="edit" element={<ProfileEdit />} />
            <Route path="settings" element={<ProfileSettings />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
