import { Route, Routes } from "react-router-dom";
import { NutritionDashboard } from "./dashboard/nutrition-dashboard";
import { AddFood } from "./add-food/nutrition-add";
import { NotFound } from "@/routes";

export function NutritionRoutes() {
    return (
        <Routes>
            <Route index element={<NutritionDashboard />} />
            <Route path="add" element={<AddFood />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}