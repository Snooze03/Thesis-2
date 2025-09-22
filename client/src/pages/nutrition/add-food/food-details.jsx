import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useNutritionSearch } from "@/hooks/nutrition/useNutritionSearch";
import { SubLayout } from "@/layouts/sub-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

function FoodDetails() {
    const { useFoodDetails } = useNutritionSearch();
    const navigate = useNavigate();
    const location = useLocation();
    const foodId = location.state?.foodId;
    const [selectedServingId, setSelectedServingId] = useState("");

    console.log("FoodDetails received foodId:", foodId);

    const {
        data,
        isLoading,
        error
    } = useFoodDetails(foodId);

    const foodDetails = data?.food
    const foodServings = foodDetails?.servings;

    if (isLoading) {
        return <LoadingSpinner message="food" />;
    }

    console.log("Food Details Data:", foodDetails);

    // Get servings array - handle both single serving and multiple servings
    const servings = Array.isArray(foodServings?.serving)
        ? foodServings.serving
        : foodServings?.serving
            ? [foodServings.serving]
            : [];

    // Find the selected serving or use the first one as default
    const selectedServing = selectedServingId
        ? servings.find(serving => serving.serving_id === selectedServingId)
        : servings[0];

    // Handle serving selection
    const handleServingChange = (servingId) => {
        setSelectedServingId(servingId);
    };

    return (
        <SubLayout>
            <div className="flex gap-2 items-center">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft className="size-5" />
                </Button>
                <h1 className="font-bold">Back to Search</h1>
            </div>

            <Card>
                <CardHeader className="-mb-3">
                    <CardTitle>{foodDetails?.food_name || "Food Name"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="px-3 py-2 bg-primary-300 rounded-sm text-center">
                            <p>Calories</p>
                            <p>{selectedServing?.calories || 0}</p>
                        </div>
                        <div className="px-3 py-2 bg-primary-300 rounded-sm text-center">
                            <p>Protein</p>
                            <p>{selectedServing?.protein || 0}g</p>
                        </div>
                        <div className="px-3 py-2 bg-primary-300 rounded-sm text-center">
                            <p>Carbs</p>
                            <p>{selectedServing?.carbohydrate || 0}g</p>
                        </div>
                        <div className="px-3 py-2 bg-primary-300 rounded-sm text-center">
                            <p>Fats</p>
                            <p>{selectedServing?.fat || 0}g</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center gap-3">
                        <p>Serving Size</p>
                        <Select onValueChange={handleServingChange} value={selectedServingId}>
                            <SelectTrigger className="min-w-1 max-w-40">
                                <SelectValue placeholder="Select serving size" />
                            </SelectTrigger>
                            <SelectContent>
                                {servings.map((serving, index) => (
                                    <SelectItem
                                        key={serving.serving_id || index}
                                        value={serving.serving_id || index.toString()}
                                    >
                                        {serving.metric_serving_amount} {serving.metric_serving_unit}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <p>Custom Serving</p>
                    </div>
                </CardContent>
            </Card>
        </SubLayout>
    );
}

export { FoodDetails }