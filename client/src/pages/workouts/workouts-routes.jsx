import { Route, Routes } from "react-router-dom";
import { WorkoutsDashboard } from "./dashboard/workouts-dashboard";
import { CreateTemplate } from "./create/workouts-create";
import { SearchExercise } from "./create/workouts-search";
import { NotFound } from "@/routes";

export function WorkoutsRoutes() {
    return (
        <Routes>
            <Route index element={<WorkoutsDashboard />} />
            <Route path="templates/create" element={<CreateTemplate />} />
            <Route path="templates/edit" element={<CreateTemplate />} />
            <Route path="templates/search" element={<SearchExercise />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}