import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useNutritionSearch } from "@/hooks/nutrition/useNutritionSearch";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { clsx } from "clsx";
import { useDebounce } from "@/hooks/nutrition/useDebounce";

const SearchFood = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const navigate = useNavigate();

    const { useFoodSearch } = useNutritionSearch();

    // Search foods query
    const {
        data,
        isLoading,
        error
    } = useFoodSearch(debouncedSearchTerm);

    // Single useEffect for logging
    useEffect(() => {
        if (data?.foods?.food) {
            console.log("Foods array:", data.foods.food);
        }
        if (error) {
            console.error("Search Error:", error);
        }
    }, [data, error]);

    const handleAddFood = useCallback((food) => {
        navigate("food", { state: { foodId: food.food_id } });
    }, []);

    const foods = data?.foods?.food || [];
    const totalResults = data?.foods?.total_results || 0;
    const hasResults = !isLoading && foods.length > 0;
    const noResults = !isLoading && debouncedSearchTerm && foods.length === 0 && !error;

    return (
        <>
            {/* Search Input */}
            <div className="relative w-full block col-span-4">
                <Input
                    id="food-search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="col-span-4 pl-10"
                    placeholder="e.g., chicken breast, apple, rice..."
                />
                <Search className={cn(
                    "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
                )} />
            </div>

            {/* Loading States */}
            {isLoading && (
                <div className="flex justify-center py-4">
                    <span className="ml-2 text-sm text-gray-600">Searching foods...</span>
                </div>
            )}

            {/* Error States */}
            {error && (
                <div className="space-y-2">
                    <p className="text-sm text-red-500">Error: {error.message}</p>
                    {error.response?.data?.error && (
                        <p className="text-xs text-red-400">
                            Details: {error.response.data.error}
                        </p>
                    )}
                </div>
            )}

            {/* Search Results */}
            {hasResults && (
                <div className="mt-4 space-y-4">
                    <p className="text-sm text-gray-600">
                        Found {totalResults} results, showing {foods.length}
                    </p>
                    <div className="flex flex-col gap-2">
                        {foods.map((food, index) => (
                            <FoodItem
                                key={food.food_id || index}
                                food={food}
                                onAdd={() => handleAddFood(food)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* No Results */}
            {noResults && (
                <div className="w-full h-full text-center py-8">
                    <p className="text-gray-500">
                        No foods found for "{debouncedSearchTerm}"
                    </p>
                </div>
            )}
        </>
    );
};

// Updated FoodItem component with loading states
const FoodItem = ({ food, isSelected, isLoadingDetails, onAdd }) => (
    <div
        className={clsx(
            "px-3 py-2 rounded-lg hover:shadow-sm transition-all delay-20 duration-100 ease-in-out cursor-pointer border",
            isSelected
                ? "bg-primary-100 border-primary-300"
                : "hover:bg-primary-50 border-gray-200",
            isLoadingDetails && "opacity-50"
        )}
        onClick={onAdd}
    >
        <div className="flex gap-2 items-center">
            <p className="font-medium">{food.food_name}</p>
            {food.brand_name && (
                <p className="text-gray-600">({food.brand_name})</p>
            )}
        </div>
        {food.food_description && (
            <p className="text-gray-600 text-sm mt-1">{food.food_description}</p>
        )}
    </div>
);

export { SearchFood };