import api from '@/api';
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { useNutritionSearch } from "@/hooks/nutrition/useNutritionSearch";
import { useAddFoodToDailyEntry } from "@/hooks/nutrition/add-food/useAddFoodToDailyEntry";
import { SubLayout } from "@/layouts/sub-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-hot-toast";
import { quartersToMonths } from "date-fns";

function FoodDetails() {
    const { useFoodDetails } = useNutritionSearch();
    const navigate = useNavigate();
    const location = useLocation();
    const foodId = location.state?.foodId;
    const [selectedServingId, setSelectedServingId] = useState("");
    const [customAmount, setCustomAmount] = useState("");
    const [customUnit, setCustomUnit] = useState("");
    const [selectedMeal, setSelectedMeal] = useState("");
    const meal = ["breakfast", "lunch", "dinner", "snack"];
    const servingSizes = ["g (grams)", "oz (ounces)", "ml (milliliters)"];

    const {
        addFood,
        isLoading: isAddingFood,
        isSuccess
    } = useAddFoodToDailyEntry();

    // console.log("FoodDetails received foodId:", foodId);

    const {
        data,
        isLoading,
        error
    } = useFoodDetails(foodId);

    const foodDetails = data?.food
    const foodServings = foodDetails?.servings;

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

    // ===== EVENT HANDLERS =====
    // Handle serving selection
    const handleServingChange = (servingId) => {
        setSelectedServingId(servingId);
    };

    // Handle custom unit selection
    const handleCustomUnitChange = (unit) => {
        setCustomUnit(unit);
    };

    // Handle meal selection
    const handleMealChange = (mealType) => {
        setSelectedMeal(mealType);
    };


    const handleAddFood = () => {
        const foodData = {
            food_id: foodDetails.food_id || foodId,
            food_name: foodDetails.food_name || null,
            brand_name: foodDetails.brand_name || null,
            food_type: foodDetails.food_type || null,
            food_description: foodDetails.food_description || null,
            servings: servings || []
        }
        const entryData = {
            daily_entry: 11,
            meal_type: selectedMeal,
            serving_type: "fatsecret",
            fatsecret_serving_id: selectedServingId || (servings[0] ? servings[0].serving_id : null),
            custom_serving_unit: customUnit || null,
            custom_serving_amount: customAmount || null,
            quantity: 1
        }

        addFood({ foodData, entryData });
    }
    // ===== END EVENT HANDLERS =====

    // console.log("Food Details Data:", foodDetails);
    // console.log("Selected Serving Id:", selectedServingId);
    // console.log("Brand name:", foodDetails?.food_name);

    return (
        <SubLayout>
            <div className="flex gap-2 items-center">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft className="size-5" />
                </Button>
                <h1 className="font-bold">Back to Search</h1>
            </div>

            {isLoading && <LoadingSpinner message="food details" />}

            {!isLoading && (
                <>
                    <Card className="pt-0">
                        <CardHeader className="-mb-1 pt-3 pb-2 rounded-t-lg bg-primary text-white">
                            <CardTitle className="text-lg">
                                {foodDetails?.food_name || "Food Name"} <span className="font-normal text-gray-700">{foodDetails?.brand_name}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Food macros */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="px-3 py-2 bg-primary-200 rounded-sm text-center shadow-sm">
                                    <p className="font-semibold text-gray-900">
                                        Calories
                                    </p>
                                    <p>{selectedServing?.calories || 0}</p>
                                </div>
                                <div className="px-3 py-2 bg-green-200 rounded-sm text-center shadow-sm">
                                    <p className="font-semibold text-gray-900">Protein</p>
                                    <p>{selectedServing?.protein || 0} <span className="text-gray-700">g</span></p>
                                </div>
                                <div className="px-3 py-2 bg-orange-200 rounded-sm text-center shadow-sm">
                                    <p className="font-semibold text-gray-900">Carbs</p>
                                    <p>{selectedServing?.carbohydrate || 0} <span className="text-gray-700">g</span></p>
                                </div>
                                <div className="px-3 py-2 bg-violet-200 rounded-sm text-center shadow-sm">
                                    <p className="font-semibold text-gray-900">Fats</p>
                                    <p>{selectedServing?.fat || 0} <span className="text-gray-700">g</span></p>
                                </div>
                            </div>

                            {/* FatSecret Servings */}
                            <div className="grid grid-rows-2 ">
                                <div className="flex items-center justify-between gap-4">
                                    <p>Serving Options</p>
                                    <Separator className="h-px flex-1 bg-border " />
                                </div>
                                <Select onValueChange={handleServingChange} value={selectedServingId}>
                                    <SelectTrigger className="w-full">
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

                            {/* Custom Serving Input */}
                            <div className="grid grid-rows-2">
                                <div className="flex items-center justify-between gap-4">
                                    <p>Custom Serving</p>
                                    <Separator className="h-px flex-1 bg-border " />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        placeholder="Amount"
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                    />
                                    <Select onValueChange={handleCustomUnitChange} value={customUnit}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Serving metric" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {servingSizes.map((size, index) => (
                                                <SelectItem
                                                    key={index}
                                                    value={size}
                                                >
                                                    {size}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Meal Selection */}
                            <div className="grid grid-rows-2">
                                <div className="flex items-center justify-between gap-4">
                                    <p>Add to Meal</p>
                                    <Separator className="h-px flex-1 bg-border " />
                                </div>
                                <Select onValueChange={handleMealChange} value={selectedMeal}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select meal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {meal.map((mealItem, index) => (
                                            <SelectItem
                                                key={index}
                                                value={mealItem}
                                            >
                                                {mealItem.charAt(0).toUpperCase() + mealItem.slice(1)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                className="w-full mt-2"
                                onClick={handleAddFood}
                                disabled={isAddingFood}
                            >
                                {isAddingFood ? 'Adding Food...' : 'Add Food'}
                            </Button>
                        </CardContent>
                    </Card>
                </>
            )}

        </SubLayout>
    );
}

export { FoodDetails }