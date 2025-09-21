import { useState, useEffect } from "react";
import { useNutritionSearch } from "@/hooks/nutrition/useNutritionSearch";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { clsx } from "clsx";
import { Button } from "@/components/ui/button";

const SearchFood = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const { useFoodSearch } = useNutritionSearch();

    // Debounce search term to avoid too many API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const {
        data,
        isLoading,
        error
    } = useFoodSearch(debouncedSearchTerm);

    // Console log the search results
    useEffect(() => {
        if (data) {
            console.log("FatSecret Search Results:", data);
            // Log the structure to understand the response data
            if (data.foods && data.foods.food) {
                console.log("Foods array:", data.foods.food);
                // console.log("Total results:", data.foods.total_results);
            }
        }
    }, [data]);

    useEffect(() => {
        if (error) {
            console.error("Search Error:", error);
            console.error("Error details:", error.response?.data);
        }
    }, [error]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
    }

    const handleAddFood = (food) => {
        console.log("Adding food:", food.food_id);
        // TODO: Add food to meal logic
    }

    // Get the foods array 
    const foods = data?.foods?.food || [];
    const totalResults = data?.foods?.total_results || 0;

    return (
        <>
            <form onSubmit={handleSearchSubmit} className="relative w-full block col-span-4">
                <Input
                    id="food-search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="col-span-4 pl-10"
                    placeholder="e.g., chicken breast, apple, rice..."
                />
                <Search className={cn(
                    "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none",
                )} />
            </form>

            {isLoading && (
                <div className="flex justify-center py-4">
                    <LoadingSpinner />
                </div>
            )}

            {error && (
                <div className="space-y-2">
                    <p className="text-sm text-red-500">
                        Error: {error.message}
                    </p>
                    {error.response?.data?.error && (
                        <p className="text-xs text-red-400">
                            Details: {error.response.data.error}
                        </p>
                    )}
                </div>
            )}

            {/* Display search results */}
            {!isLoading && foods.length > 0 && (
                <div className="mt-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                            Found {totalResults} results, showing {foods.length}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        {foods.map((food, index) => (
                            <FoodItem
                                key={food.food_id || index}
                                food={food}
                                index={index}
                                onAdd={() => handleAddFood(food)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* No results message */}
            {!isLoading && debouncedSearchTerm && foods.length === 0 && !error && (
                <div className="w-full h-full text-center py-8">
                    <p className="text-gray-500">
                        No foods found for "{debouncedSearchTerm}"
                    </p>
                </div>
            )}
        </>
    );
};

// Individual food item component 
function FoodItem({ food, index, onAdd }) {
    return (
        <div
            className={clsx(
                "px-3 py-2 rounded-lg hover:shadow-sm transition-all delay-20 duration-100 ease-in-out cursor-pointer border",
                "hover:bg-primary-50 border-gray-200"
            )}
            onClick={onAdd}
        >
            {/* Render list items using the food data */}
            <div className="flex gap-2">
                <p className="font-medium">
                    {food.food_name}
                </p>
                {food.brand_name && (
                    <p className="text-gray-600">
                        ({food.brand_name})
                    </p>
                )}
            </div>

            {food.food_description && (
                <p className="text-gray-600 text-sm mt-1">
                    {food.food_description}
                </p>
            )}
        </div>
    );
}

export { SearchFood }