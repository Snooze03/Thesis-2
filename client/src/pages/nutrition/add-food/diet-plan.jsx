import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectionSubTitle } from "@/components/ui/section-title";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EmptyItems } from "@/components/empty-items";
import { useDietPlan } from "@/hooks/nutrition/diet-plan/useDietPlan";
import { SearchFood } from "./search-food";
import { Flame, Wheat, Beef, Citrus, Pencil, Trash } from "lucide-react";
import { KebabMenu } from "@/components/ui/kebab-menu";
import clsx from "clsx";

function DietPlan() {
    const navigate = useNavigate();
    const [showSearchFood, setShowSearchFood] = useState(false);

    const {
        fetchDietPlan: { data: dietPlanData, isLoading, isError },
        deleteMealItem: { mutate: deleteMealItem }
    } = useDietPlan();

    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error loading diet plan</div>;

    console.log(dietPlanData);

    const mainDietPlan = dietPlanData?.find(plan => !plan.is_alternative);
    const is_alternative = dietPlanData?.find(plan => plan.is_alternative);
    const mainDietPlanId = mainDietPlan?.id;

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
                dietPlanId: mainDietPlanId
            }
        });
        setShowSearchFood(false);
    }

    const handleDeleteFood = (foodEntryId) => {
        deleteMealItem(foodEntryId);
    }

    // Component to render individual food items
    const renderFoodItem = (foodEntry) => {
        const selectedServing = getSelectedServing(foodEntry);

        const menuItems = [
            { icon: Pencil, label: "Edit", action: () => console.log("Edit food entry") },
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
                            Serving: {Number(selectedServing.amount).toFixed(2)} {selectedServing.unit} •
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
        const foodItems = mainDietPlan?.[mealType.key] || [];

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
        </>
    );
}

export { DietPlan };