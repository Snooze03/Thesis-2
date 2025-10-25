import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SearchFood } from "./search-food";

export const AddSearch = () => {
    const navigate = useNavigate();

    const handleAddFood = useCallback((food) => {
        navigate("food", { state: { foodId: food.food_id } });
    }, [navigate]);

    return (
        <SearchFood defaultPlaceholder="e.g., chicken breast, apple, rice...">
            <SearchFood.Input />
            <SearchFood.Loading>Searching foods...</SearchFood.Loading>
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

            <SearchFood.NoResults />
        </SearchFood>
    );
};
