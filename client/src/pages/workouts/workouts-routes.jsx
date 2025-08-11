import { Route, Routes } from "react-router-dom";
import { WorkoutsDashboard } from "./workouts-dashboard";
import { CreateTemplate } from "./workouts-search";

export function WorkoutsRoutes() {
    return (
        <Routes>
            <Route index element={<WorkoutsDashboard />} />
            <Route path="create" element={<CreateTemplate />} />
        </Routes>
    );
}
