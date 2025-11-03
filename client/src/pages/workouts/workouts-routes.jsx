import { Route, Routes } from "react-router-dom";
import { WorkoutsDashboard } from "./dashboard/workouts-dashboard";
import { WorkoutsTemplate } from "./create/workouts-template";
import { SearchExercise } from "./create/workouts-search";
import { NotFound } from "@/routes";
import { Provider } from "jotai";

export function WorkoutsRoutes() {
    return (
        <Provider>
            <Routes>
                <Route index element={<WorkoutsDashboard />} />
                <Route path="templates" element={<WorkoutsTemplate />} />
                <Route path="templates/search" element={<SearchExercise />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Provider>
    );
}