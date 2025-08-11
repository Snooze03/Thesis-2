import { Route, Routes } from "react-router-dom";
import { WorkoutsDashboard } from "./workouts-dashboard";

export function WorkoutsRoutes() {
    return (
        <Routes>
            <Route index element={<WorkoutsDashboard />} />
            <Route path="create" element={<h1>Create template</h1>} />
        </Routes>
    );
}
