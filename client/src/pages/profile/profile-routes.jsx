import { Route, Routes } from "react-router-dom";
import { Profile } from "./dashboard/profile-dashboard";
import { ProfileSettings } from "./profile-settings";
import { ProfileEdit } from "./edit/profile-edit";
import { WeightAllEntries } from "./dashboard/weight-all-entries";
import { NotFound } from "@/routes";

export function ProfileRoutes() {
    return (
        <Routes>
            <Route index element={<Profile />} />
            <Route path="edit" element={<ProfileEdit />} />
            <Route path="settings" element={<ProfileSettings />} />
            <Route path="weight-entries" element={<WeightAllEntries />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
