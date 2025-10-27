import { useEffect, useState, createContext, useContext } from "react";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useFatSecretSearch } from "@/hooks/nutrition/useFatSecretSearch";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Flame, Beef, Wheat, Citrus, Utensils, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "react-hot-toast";
import clsx from "clsx";
import { addFoodSchema } from "@/pages/nutrition/add-food/add-food-schema";

// Context for sharing state between components
const AddFoodFormContext = createContext();

// Main container component
const AddFoodForm = ({
    children,
    foodData,
    onSubmit,
    isLoading,
    isError,
    isSubmitting = false,
    isAddingToDietPlan = false,
    defaultValues = {},
    showMealSelection = true
}) => {
    const [isCustomServing, setIsCustomServing] = useState(false);

    // Form handler
    const form = useForm({
        resolver: valibotResolver(addFoodSchema),
        defaultValues: {
            selectedServingId: "",
            customAmount: "",
            customUnit: "",
            selectedMeal: "",
            quantity: 1,
            ...defaultValues
        }
    });

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors }
    } = form;

    // Get data from foodData prop
    // console.log(`Food Data: ${JSON.stringify(foodData)}`);
    const foodDetails = foodData?.food;
    const foodServings = foodDetails?.servings;

    // Get servings array
    const servings = Array.isArray(foodServings?.serving)
        ? foodServings.serving
        : foodServings?.serving
            ? [foodServings.serving]
            : [];

    // Watch form values
    const selectedServingId = watch("selectedServingId");
    const customAmount = watch("customAmount");
    const customUnit = watch("customUnit");
    const selectedMeal = watch("selectedMeal");
    const quantity = watch("quantity");

    // Find selected serving
    const selectedServing = selectedServingId
        ? servings.find(serving => serving.serving_id === selectedServingId)
        : servings[0];

    // Set default serving when servings are loaded
    useEffect(() => {
        if (servings.length > 0 && !selectedServingId) {
            setValue("selectedServingId", servings[0].serving_id);
        }
    }, [servings, selectedServingId, setValue]);

    // Show validation errors as toasts
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const firstError = Object.values(errors)[0];
            toast.error(firstError.message);
        }
    }, [errors]);

    // Form submission handler
    const handleFormSubmit = (formData) => {
        const foodData = {
            food_id: foodDetails.food_id || foodId,
            food_name: foodDetails.food_name || null,
            brand_name: foodDetails.brand_name || null,
            food_type: foodDetails.food_type || null,
            food_description: foodDetails.food_description || null,
            servings: servings || []
        };

        const entryData = {
            meal_type: formData.selectedMeal,
            serving_type: isCustomServing ? "custom" : "fatsecret",
            fatsecret_serving_id: !isCustomServing ? (formData.selectedServingId || servings[0]?.serving_id) : null,
            custom_serving_unit: isCustomServing ? formData.customUnit : null,
            custom_serving_amount: isCustomServing ? formData.customAmount : null,
            quantity: formData.quantity || 1
        };

        console.log(`Entry Data: ${entryData.quantity}`);

        onSubmit({ foodData, entryData, formData });
    };

    const contextValue = {
        // Form data
        form,
        register,
        setValue,
        watch,

        // Food data
        foodDetails,
        servings,
        selectedServing,
        isLoading,
        isError,

        // Form state
        selectedServingId,
        customAmount,
        customUnit,
        selectedMeal,
        quantity,
        isCustomServing,
        setIsCustomServing,

        // Config
        showMealSelection,
        isSubmitting,
        isAddingToDietPlan
    };

    if (isLoading) {
        return <LoadingSpinner message="food details..." />;
    }

    if (isError) {
        return <div className="text-red-500">Error loading food details: {isError.message}</div>;
    }

    return (
        <AddFoodFormContext.Provider value={contextValue}>
            <form onSubmit={handleSubmit(handleFormSubmit)}>
                {children}
            </form>
        </AddFoodFormContext.Provider>
    );
};

// Header component
const AddFoodFormHeader = ({ children, onBack, showBackButton = false }) => {
    return (
        <div className="flex gap-2 items-center mb-4">
            {showBackButton && onBack && (
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft className="size-5" />
                </Button>
            )}
            {children}
        </div>
    );
};

// Card container component
const AddFoodFormCard = ({ children }) => {
    const { foodDetails } = useContext(AddFoodFormContext);

    return (
        <Card className="pt-0">
            <CardHeader className="-mb-1 pt-3 pb-2 rounded-t-lg bg-primary-700 text-white">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2 items-center">
                        <p className="font-bold text-lg">
                            {foodDetails?.food_name || "Food Name"}
                        </p>
                        <span className="font-normal">
                            {foodDetails?.brand_name ? `(${foodDetails.brand_name})` : null}
                        </span>
                    </div>
                    <Utensils className="size-5 stroke-white" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {children}
            </CardContent>
        </Card>
    );
};

// Nutrition display component
const AddFoodFormNutrition = () => {
    const { selectedServing, quantity } = useContext(AddFoodFormContext);

    const multiplier = quantity || 1;

    return (
        <div className="grid grid-cols-4 gap-3">
            <div className="px-3 py-2 flex flex-col items-center justify-center gap-[2px] bg-primary-100 rounded-md text-gray-700">
                <Flame className="size-4 stroke-primary" />
                <p className="text-sm">Calories</p>
                <p className="text-sm">{Math.round((selectedServing?.calories || 0) * multiplier)}</p>
            </div>
            <div className="px-3 py-2 flex flex-col items-center justify-center gap-[2px] bg-green-100 rounded-md text-green-500">
                <Beef className="size-4 stroke-green-400" />
                <p className="text-sm">Protein</p>
                <p className="text-sm">{Math.round((selectedServing?.protein || 0) * multiplier)} g</p>
            </div>
            <div className="px-3 py-2 flex flex-col items-center justify-center gap-[2px] bg-orange-100 rounded-md text-orange-500">
                <Wheat className="size-4 stroke-orange-400" />
                <p className="text-sm">Carbs</p>
                <p className="text-sm">{Math.round((selectedServing?.carbohydrate || 0) * multiplier)} g</p>
            </div>
            <div className="px-3 py-2 flex flex-col items-center justify-center gap-[2px] bg-purple-100 rounded-md text-purple-500">
                <Citrus className="size-4 stroke-purple-400" />
                <p className="text-sm">Fats</p>
                <p className="text-sm">{Math.round((selectedServing?.fat || 0) * multiplier)} g</p>
            </div>
        </div>
    );
};

// Serving selection component
const AddFoodFormServings = () => {
    const {
        servings,
        selectedServingId,
        setValue,
        isCustomServing,
        setIsCustomServing
    } = useContext(AddFoodFormContext);

    return (
        <div className="grid grid-rows-2" onClick={() => setIsCustomServing(false)}>
            <div className="flex items-center justify-between gap-4">
                <p className={clsx(
                    "text-black",
                    { "text-gray-600": isCustomServing },
                    { "font-bold": !isCustomServing },
                )}>Serving Options</p>
                <Separator className="h-px flex-1 bg-border" />
            </div>
            <Select
                onValueChange={(value) => setValue("selectedServingId", value)}
                value={selectedServingId}
                disabled={isCustomServing}
            >
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
    );
};

// Custom serving component
const AddFoodFormCustomServing = () => {
    const {
        register,
        setValue,
        customUnit,
        isCustomServing,
        setIsCustomServing
    } = useContext(AddFoodFormContext);

    const servingSizes = ["g (grams)", "oz (ounces)", "ml (milliliters)"];

    return (
        <div className="grid grid-rows-2" onClick={() => setIsCustomServing(true)}>
            <div className="flex items-center justify-between gap-4">
                <p className={clsx(
                    "text-black",
                    { "text-gray-600": !isCustomServing },
                    { "font-bold": isCustomServing },
                )}>Custom Serving</p>
                <Separator className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Input
                    {...register("customAmount")}
                    placeholder="Amount"
                    type="number"
                    min="0"
                    step="0.1"
                    disabled={!isCustomServing}
                />
                <Select
                    onValueChange={(value) => setValue("customUnit", value)}
                    value={customUnit}
                    disabled={!isCustomServing}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Serving metric" />
                    </SelectTrigger>
                    <SelectContent>
                        {servingSizes.map((size, index) => (
                            <SelectItem key={index} value={size}>
                                {size}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};

// Quantity input component
const AddFoodFormQuantity = () => {
    const { register } = useContext(AddFoodFormContext);

    return (
        <div className="grid grid-rows-2">
            <div className="flex items-center justify-between gap-4">
                <p>Quantity</p>
                <Separator className="h-px flex-1 bg-border" />
            </div>
            <Input
                {...register("quantity")}
                placeholder="Quantity"
                type="number"
                min="0.1"
                step="0.1"
                defaultValue="1"
            />
        </div>
    );
};

// Meal selection component
const AddFoodFormMealSelection = () => {
    const { setValue, selectedMeal, showMealSelection } = useContext(AddFoodFormContext);

    if (!showMealSelection) return null;

    const meals = ["breakfast", "lunch", "dinner", "snack"];

    return (
        <div className="grid grid-rows-2">
            <div className="flex items-center justify-between gap-4">
                <p>Add to Meal</p>
                <Separator className="h-px flex-1 bg-border" />
            </div>
            <Select
                onValueChange={(value) => setValue("selectedMeal", value)}
                value={selectedMeal}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select meal" />
                </SelectTrigger>
                <SelectContent>
                    {meals.map((meal, index) => (
                        <SelectItem key={index} value={meal}>
                            {meal.charAt(0).toUpperCase() + meal.slice(1)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

// Submit button component
const AddFoodFormSubmitButton = ({ children = "Add Food" }) => {
    const { isSubmitting, isAddingToDietPlan } = useContext(AddFoodFormContext);

    // Button should be disabled if either loading state is true
    const isDisabled = isSubmitting || isAddingToDietPlan;

    return (
        <Button
            type="submit"
            className="w-full mt-2"
            disabled={isDisabled}
        >
            {isDisabled ? 'Adding Food...' : children}
        </Button>
    );
};

// Attach components to main component
AddFoodForm.Header = AddFoodFormHeader;
AddFoodForm.Card = AddFoodFormCard;
AddFoodForm.Nutrition = AddFoodFormNutrition;
AddFoodForm.Servings = AddFoodFormServings;
AddFoodForm.CustomServing = AddFoodFormCustomServing;
AddFoodForm.Quantity = AddFoodFormQuantity;
AddFoodForm.MealSelection = AddFoodFormMealSelection;
AddFoodForm.SubmitButton = AddFoodFormSubmitButton;

export { AddFoodForm };