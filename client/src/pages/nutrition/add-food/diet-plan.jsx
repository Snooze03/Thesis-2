import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectionSubTitle } from "@/components/ui/section-title";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EmptyItems } from "@/components/empty-items";
import { useDietPlan } from "@/hooks/nutrition/diet-plan/useDietPlan";
import { SearchFood } from "./search-food";

function DietPlan() {
    const navigate = useNavigate();
    const [showSearchFood, setShowSearchFood] = useState(false);

    const {
        fetchDietPlan: { data: dietPlanData, isLoading, isError },
        addFoodToDietPlan: { mutate: addFoodMutate }
    } = useDietPlan();

    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error loading diet plan</div>;

    const handleSearchToggle = () => {
        setShowSearchFood(true);
    };

    const handleAddFood = (food) => {
        navigate("food", { state: { foodId: food.food_id } });
        setShowSearchFood(false);
    }

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
        <div className="space-y-3">
            <div className="space-y-3">
                <div className="flex justify-between items-center border-b-2 pb-3">
                    <SectionSubTitle>Breakfast</SectionSubTitle>
                    <Button className="text-white h-min" onClick={handleSearchToggle}>
                        <Plus /> Add
                    </Button>
                </div>
                <EmptyItems />
            </div>
        </div>
    );
}

export { DietPlan };