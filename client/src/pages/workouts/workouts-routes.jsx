import { Route, Routes } from "react-router-dom";
import { WorkoutsDashboard } from "./workouts-dashboard";
import { CreateTemplate } from "./workouts-create";
import { SearchExercise } from "./workouts-search";
import { NotFound } from "@/routes";

export function WorkoutsRoutes() {
    return (
        <Routes>
            <Route index element={<WorkoutsDashboard />} />
            <Route path="templates/create" element={<CreateTemplate />} />
            <Route path="templates/:template_id/edit" element={<CreateTemplate />} />
            <Route path="templates/:template_id/search" element={<SearchExercise />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
