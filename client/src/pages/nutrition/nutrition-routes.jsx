import { Route, Routes } from "react-router-dom";
import { NutritionDashboard } from "./dashboard/nutrition-dashboard";
import { NotFound } from "@/routes";

export function NutritionRoutes() {
    return (
        <Routes>
            <Route index element={<NutritionDashboard />} />
            <Route path="" element={<h1>Nutrition Templates</h1>} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}