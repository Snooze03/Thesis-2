import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useNutritionSearch } from "@/hooks/nutrition/useNutritionSearch";

const FoodSearchTest = () => {
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

    const { data, isLoading, error } = useFoodSearch(debouncedSearchTerm);

    // Console log the search results
    useEffect(() => {
        if (data) {
            console.log("FatSecret Search Results:", data);
            // Log the structure to understand the response
            if (data.foods && data.foods.food) {
                console.log("Foods array:", data.foods.food);
                console.log("Total results:", data.foods.total_results);
            }
        }
    }, [data]);

    useEffect(() => {
        if (error) {
            console.error("Search Error:", error);
            console.error("Error details:", error.response?.data);
        }
    }, [error]);

    return (
        <Card>
            <CardContent className="space-y-4">
                <div>
                    <label htmlFor="food-search" className="block text-sm font-medium mb-2">
                        Search Food (Check console for results)
                    </label>
                    <Input
                        id="food-search"
                        type="text"
                        placeholder="e.g., chicken breast, apple, rice..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {isLoading && (
                    <p className="text-sm text-muted-foreground">Searching...</p>
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

                {data && data.foods && (
                    <div className="space-y-2">
                        <p className="text-sm text-green-600">
                            Found {data.foods.total_results || 0} results! Check console for details.
                        </p>
                        {data.foods.food && Array.isArray(data.foods.food) && (
                            <p className="text-xs text-gray-500">
                                Showing {data.foods.food.length} items
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};