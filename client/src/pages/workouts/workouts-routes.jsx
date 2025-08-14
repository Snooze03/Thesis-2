import { Route, Routes } from "react-router-dom";
import { WorkoutsDashboard } from "./workouts-dashboard";
import { CreateTemplate } from "./workouts-create";
import { SearchExercise } from "./workouts-search";

export function WorkoutsRoutes() {
    return (
        <Routes>
            <Route index element={<WorkoutsDashboard />} />
            <Route path="create" element={<CreateTemplate />} />
            <Route path="create/search/:template_id" element={<SearchExercise />} />
        </Routes>
    );
}
