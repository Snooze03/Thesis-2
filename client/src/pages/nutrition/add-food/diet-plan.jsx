import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDailyEntry } from "@/hooks/nutrition/useDailyEntry";
import { SectionSubTitle } from "@/components/ui/section-title";
import { Button } from "@/components/ui/button";
import { EmptyItems } from "@/components/empty-items";
import { useDietPlan } from "@/hooks/nutrition/diet-plan/useDietPlan";
import { SearchFood } from "./search-food";
import { FoodDetailsDialog } from "../dashboard/food-details-dialog";
import { Plus, Wheat, Beef, Citrus, Pencil, Trash } from "lucide-react";
import { KebabMenu } from "@/components/ui/kebab-menu";
import clsx from "clsx";

function DietPlan({ is_alternative = false }) {
    const navigate = useNavigate();
    const [showSearchFood, setShowSearchFood] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [foodDatabaseId, setFoodDatabaseId] = useState(null);

    const {
        data: todayDailyEntryID,
    } = useDailyEntry();

    const {
        fetchDietPlan: { data: dietPlanData, isLoading, isError },
        deleteMealItem: { mutate: deleteMealItem },
        addFoodToDailyEntry: { mutate: addFoodToEntry }
    } = useDietPlan();

    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error loading diet plan</div>;


    const selectedDietPlan = dietPlanData?.find(plan =>
        is_alternative ? plan.is_alternative : !plan.is_alternative
    );
    const selectedDietPlanId = selectedDietPlan?.id;

    // Define meal types with their corresponding data keys
    const mealTypes = [
        { key: 'breakfast_foods', label: 'Breakfast' },
        { key: 'lunch_foods', label: 'Lunch' },
        { key: 'dinner_foods', label: 'Dinner' },
        { key: 'snack_foods', label: 'Snacks' }
    ];

    // Helper function to get the selected serving details
    const getSelectedServing = (foodEntry) => {
        if (foodEntry.serving_type === "custom") {
            return {
                description: `${foodEntry.custom_serving_amount} ${foodEntry.custom_serving_unit}`,
                amount: foodEntry.custom_serving_amount,
                unit: foodEntry.custom_serving_unit
            };
        }

        if (foodEntry.serving_type === "fatsecret" && foodEntry.fatsecret_serving_id) {
            const selectedServing = foodEntry.food.fatsecret_servings?.find(
                serving => serving.serving_id === foodEntry.fatsecret_serving_id
            );

            if (selectedServing) {
                return {
                    description: selectedServing.serving_description,
                    amount: selectedServing.metric_serving_amount,
                    unit: selectedServing.metric_serving_unit,
                    measurementDescription: selectedServing.measurement_description,
                    numberOfUnits: selectedServing.number_of_units
                };
            }
        }

        // Fallback to the serving_description if no specific serving found
        return {
            description: foodEntry.serving_description || "Unknown serving",
            amount: null,
            unit: null
        };
    };

    const handleSearchToggle = () => {
        setShowSearchFood(true);
    };

    const handleAddFood = (food) => {
        navigate("food", {
            state: {
                foodId: food.food_id,
                isDietPlan: true,
                dietPlanId: selectedDietPlanId
            }
        });
        setShowSearchFood(false);
    }

    const handleAddToEntry = (foodId, entryData) => {
        addFoodToEntry({
            dailyEntryId: todayDailyEntryID.id,
            foodId: foodId,
            entryData: { ...entryData }
        });
    }

    const handleEditFood = (foodEntry) => {
        setFoodDatabaseId(foodEntry.id);
        setDialogOpen(true);
    }

    const handleDeleteFood = (foodEntryId) => {
        deleteMealItem(foodEntryId);
    }

    // Component to render individual food items
    const renderFoodItem = (foodEntry) => {
        const selectedServing = getSelectedServing(foodEntry);

        console.log(selectedServing);

        const menuItems = [
            { icon: Plus, label: "Add", action: () => handleAddToEntry(foodEntry.food.id, foodEntry) },
            { icon: Pencil, label: "Edit", action: () => handleEditFood(foodEntry) },
            { icon: Trash, label: "Delete", action: () => handleDeleteFood(foodEntry.id), variant: "destructive" },
        ];

        return (
            <div key={foodEntry.id}
                className={clsx(
                    "px-4 py-3 border-gray-200 rounded-lg",
                    "hover:shadow-sm hover:bg-primary-50",
                    "transition-all delay-20 duration-100 ease-in-out border"
                )}
            >
                <div className="space-y-1">
                    <div className="flex justify-between items-center gap-2">
                        <div>
                            <h4 className="font-medium">{foodEntry.food.food_name}</h4>
                            {foodEntry.food.brand_name && (
                                <p className="text-sm text-gray-500">{foodEntry.food.brand_name}</p>
                            )}
                        </div>
                        <KebabMenu items={menuItems} />
                    </div>

                    <div className="flex gap-1 flex-wrap">
                        <p className="text-sm text-gray-600">
                            Serving: {selectedServing.amount && selectedServing.unit ?
                                `${Number(selectedServing.amount).toFixed(2)} ${selectedServing.unit}` :
                                selectedServing.description
                            } •
                            {/* {selectedServing.serving_description.length > 5 ? (
                                <span>{selectedServing.serving_description} • ({selectedServing.metric_serving_amount} {selectedServing.metric_serving_unit})</span>
                            ) : (
                                <span>{selectedServing.metric_serving_amount} {selectedServing.metric_serving_unit}</span>
                            )} */}
                        </p>
                        <p className="text-sm text-gray-600">
                            {foodEntry.quantity}x | Calories: {foodEntry.calories}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mt-1">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100">
                            <Wheat className="size-3 stroke-orange-400" />
                            <p className="text-orange-600 text-xs">{foodEntry.carbs}g Carbs</p>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100">
                            <Beef className="size-3 stroke-green-400" />
                            <p className="text-green-600 text-xs">{foodEntry.protein}g Protein</p>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100">
                            <Citrus className="size-3 stroke-purple-400" />
                            <p className="text-purple-600 text-xs">{foodEntry.fat}g Fats</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Component to render each meal section
    const renderMealSection = (mealType) => {
        const foodItems = selectedDietPlan?.[mealType.key] || [];

        return (
            <div key={mealType.key} className="space-y-3">
                <div className="flex justify-between items-center border-b-2 pb-3">
                    <SectionSubTitle>{mealType.label}</SectionSubTitle>
                    <Button className="text-white h-min" onClick={handleSearchToggle}>
                        <Plus /> Add
                    </Button>
                </div>

                {foodItems.length > 0 ? (
                    <div className="space-y-2">
                        {foodItems.map(renderFoodItem)}
                    </div>
                ) : (
                    <EmptyItems />
                )}
            </div>
        );
    };

    if (showSearchFood) {
        return (
            <SearchFood onFoodSelect={handleAddFood}>
                <SearchFood.Input placeholder="Search foods for your diet plan..." />
                <SearchFood.Loading>Loading foods...</SearchFood.Loading>
                <SearchFood.Error />

                <SearchFood.Results>
                    {(foods) => foods.map((food, index) => (
                        <SearchFood.Item
                            key={food.food_id || index}
                            food={food}
                            onAdd={() => handleAddFood(food)}
                        />
                    ))}
                </SearchFood.Results>

                <SearchFood.NoResults>
                    No foods found. Try searching for something else.
                </SearchFood.NoResults>
            </SearchFood>
        );
    }

    return (
        <>
            <div className="space-y-6">
                {mealTypes.map(renderMealSection)}
            </div>

            <FoodDetailsDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                foodDatabaseId={foodDatabaseId}
                isDietPlan={true}
            />
        </>
    );
}

export { DietPlan };