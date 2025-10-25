import { useState, useEffect, createContext, useContext } from "react";
import { useFatSecretSearch } from "@/hooks/nutrition/useFatSecretSearch";
import { Input } from "@/components/ui/input";
import { Search, Flame, Beef, Wheat, Citrus, } from "lucide-react";
import { cn } from "@/lib/utils";
import { clsx } from "clsx";
import { useDebounce } from "@/hooks/nutrition/useDebounce";
import { parseFoodDescription } from "@/utils/parseFoodDescription";

// Context for sharing state between components
const SearchFoodContext = createContext();

// Main container component
const SearchFood = ({ children, defaultPlaceholder = "e.g., chicken breast, apple, rice..." }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const { useFoodSearch } = useFatSecretSearch();

    const {
        data,
        isLoading,
        error
    } = useFoodSearch(debouncedSearchTerm);

    useEffect(() => {
        if (error) {
            console.error("Search Error:", error);
        }
    }, [data, error]);

    const foods = data?.foods?.food || [];
    const totalResults = data?.foods?.total_results || 0;
    const hasResults = !isLoading && foods.length > 0;
    const noResults = !isLoading && debouncedSearchTerm && foods.length === 0 && !error;

    const contextValue = {
        searchTerm,
        setSearchTerm,
        debouncedSearchTerm,
        foods,
        totalResults,
        isLoading,
        error,
        hasResults,
        noResults,
        defaultPlaceholder
    };

    return (
        <SearchFoodContext.Provider value={contextValue}>
            <div className="space-y-4">
                {children}
            </div>
        </SearchFoodContext.Provider>
    );
};

// Header component
const SearchFoodHeader = ({ children }) => {
    return (
        <div className="flex items-center gap-3">
            {children}
        </div>
    );
};

// Title component
const SearchFoodTitle = ({ children }) => {
    return <h2 className="text-lg font-semibold">{children}</h2>;
};

// Search input component
const SearchFoodInput = ({ placeholder }) => {
    const { searchTerm, setSearchTerm, defaultPlaceholder } = useContext(SearchFoodContext);

    return (
        <div className="relative w-full block">
            <Input
                id="food-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                placeholder={placeholder || defaultPlaceholder}
            />
            <Search className={cn(
                "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none size-4"
            )} />
        </div>
    );
};

// Loading component
const SearchFoodLoading = ({ children = "Searching foods..." }) => {
    const { isLoading } = useContext(SearchFoodContext);

    if (!isLoading) return null;

    return (
        <div className="flex justify-center py-4">
            <span className="ml-2 text-sm text-gray-600">{children}</span>
        </div>
    );
};

// Error component
const SearchFoodError = () => {
    const { error } = useContext(SearchFoodContext);

    if (!error) return null;

    return (
        <div className="space-y-2">
            <p className="text-sm text-red-500">Error: {error.message}</p>
            {error.response?.data?.error && (
                <p className="text-xs text-red-400">
                    Details: {error.response.data.error}
                </p>
            )}
        </div>
    );
};

// Results component
const SearchFoodResults = ({ children }) => {
    const { hasResults, totalResults, foods } = useContext(SearchFoodContext);

    if (!hasResults) return null;

    return (
        <div className="space-y-3">
            <p className="text-sm text-gray-600">
                Found {totalResults} results, showing {foods.length}
            </p>
            <div className="flex flex-col gap-3">
                {typeof children === 'function' ? children(foods) : children}
            </div>
        </div>
    );
};

// No results component
const SearchFoodNoResults = ({ children }) => {
    const { noResults, debouncedSearchTerm } = useContext(SearchFoodContext);

    if (!noResults) return null;

    return (
        <div className="w-full h-full text-center py-8">
            <p className="text-gray-500">
                {children || `No foods found for "${debouncedSearchTerm}"`}
            </p>
        </div>
    );
};

// Food item component
// Food - food data used to display food information
// OnAdd - a function to handle adding food to diet plan or daily entry
const SearchFoodItem = ({ food, onAdd }) => {
    const nutritionData = parseFoodDescription(food.food_description);

    return (
        <div className={clsx(
            "px-4 py-3 rounded-lg hover:shadow-sm transition-all delay-20 duration-100 ease-in-out border",
            "hover:bg-primary-50 border-gray-200"
        )}
            onClick={onAdd}
        >
            <div className="flex flex-wrap gap-1 justify-between items-start">
                <div className="flex-1">
                    <div className="flex flex-wrap gap-1 justify-between items-center">
                        <p className="font-medium">{food.food_name}</p>
                        {food.brand_name && (
                            <p className="text-gray-700 text-sm">({food.brand_name})</p>
                        )}
                    </div>

                    <div className="mt-1 space-y-2">
                        <div className="flex items-center gap-1">
                            <Flame className="size-3 stroke-orange-400" />
                            <p className="text-gray-700 text-sm">
                                {nutritionData.nutrition.calories} kcal
                                <span className="text-gray-500 ml-2 text-xs">
                                    Per ({nutritionData.servingSize})
                                </span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100">
                                <Wheat className="size-3 stroke-orange-400" />
                                <p className="text-orange-600 text-xs">{nutritionData.nutrition.carbs}g Carbs</p>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100">
                                <Beef className="size-3 stroke-green-400" />
                                <p className="text-green-600 text-xs">{nutritionData.nutrition.protein}g Protein</p>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100">
                                <Citrus className="size-3 stroke-purple-400" />
                                <p className="text-purple-600 text-xs">{nutritionData.nutrition.fat}g Fats</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Export all components
SearchFood.Header = SearchFoodHeader;
SearchFood.Title = SearchFoodTitle;
SearchFood.Input = SearchFoodInput;
SearchFood.Loading = SearchFoodLoading;
SearchFood.Error = SearchFoodError;
SearchFood.Results = SearchFoodResults;
SearchFood.NoResults = SearchFoodNoResults;
SearchFood.Item = SearchFoodItem;

export { SearchFood };