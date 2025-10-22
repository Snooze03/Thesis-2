import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useNutritionSearch } from "@/hooks/nutrition/useNutritionSearch";
import { useAddFoodToDailyEntry } from "@/hooks/nutrition/add-food/useAddFoodToDailyEntry";
import { useDailyEntry } from "@/hooks/nutrition/useDailyEntry";
import { addFoodSchema } from "./add-food-schema";
import { SubLayout } from "@/layouts/sub-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flame, Beef, Wheat, Citrus, Utensils } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-hot-toast";
import clsx from "clsx";

function AddFoodEntry() {
    const { useFoodDetails } = useNutritionSearch();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const foodId = location.state?.foodId;
    const [isCustomServing, setIsCustomServing] = useState(false);
    const meal = ["breakfast", "lunch", "dinner", "snack"];
    const servingSizes = ["g (grams)", "oz (ounces)", "ml (milliliters)"];

    // ===== FORM HANDLER =====
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors }
    } = useForm({
        resolver: valibotResolver(addFoodSchema),
        defaultValues: {
            selectedServingId: "",
            customAmount: "",
            customUnit: "",
            selectedMeal: ""
        }
    });
    // ===== END FORM HANDLER =====

    // Fetch Food Details
    const {
        data,
        isLoading,
        error
    } = useFoodDetails(foodId);

    // get data from json response
    const foodDetails = data?.food;
    const foodServings = foodDetails?.servings;

    // Get servings array - handle both single serving and multiple servings
    const servings = Array.isArray(foodServings?.serving)
        ? foodServings.serving
        : foodServings?.serving
            ? [foodServings.serving]
            : [];

    // Watch form values for UI updates
    const selectedServingId = watch("selectedServingId");
    const customAmount = watch("customAmount");
    const customUnit = watch("customUnit");
    const selectedMeal = watch("selectedMeal");

    // Find the selected serving, and use the first one as default
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

    // Get today's daily entry ID
    const {
        data: todayDailyEntryID,
    } = useDailyEntry();

    // ===== ADD FOOD MUTATION =====
    const {
        addFood,
        isLoading: isAddingFood,
    } = useAddFoodToDailyEntry({
        onSuccess: () => {
            toast.success('Food added successfully!');

            // Invalidate related queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['foodEntries'] });
            queryClient.invalidateQueries({ queryKey: ['todayDailyEntry'] });

            navigate(-1, { replace: true });
        }
    });
    // ===== END ADD FOOD MUTATION =====

    // ===== FORM SUBMISSION HANDLER =====
    const onSubmit = (formData) => {
        const foodData = {
            food_id: foodDetails.food_id || foodId,
            food_name: foodDetails.food_name || null,
            brand_name: foodDetails.brand_name || null,
            food_type: foodDetails.food_type || null,
            food_description: foodDetails.food_description || null,
            servings: servings || []
        };

        const entryData = {
            daily_entry: todayDailyEntryID.id,
            meal_type: formData.selectedMeal,
            serving_type: "fatsecret",
            fatsecret_serving_id: formData.selectedServingId || (servings[0] ? servings[0].serving_id : null),
            custom_serving_unit: formData.customUnit || null,
            custom_serving_amount: formData.customAmount || null,
            quantity: 1
        };

        addFood({ foodData, entryData });
    };
    // ==== END FORM SUBMISSION HANDLER =====


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
                <form onSubmit={handleSubmit(onSubmit)}>
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
                            {/* <CardTitle className="text-lg"> */}
                            {/* </CardTitle> */}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Food macros */}
                            <div className="grid grid-cols-4 gap-3">
                                <div className="px-3 py-2 flex flex-col items-center justify-center gap-[2px] bg-primary-100 rounded-md text-gray-700">
                                    <Flame className="size-4 stroke-orange-400" />
                                    <p className=" text-sm">
                                        Calories
                                    </p>
                                    <p className="text-sm">{selectedServing?.calories || 0}</p>
                                </div>
                                <div className="px-3 py-2 flex flex-col items-center justify-center gap-[2px] bg-green-100 rounded-md text-green-500">
                                    <Beef className="size-4 stroke-green-400" />
                                    <p className="text-sm">
                                        Protein
                                    </p>
                                    <p className="text-sm">{selectedServing?.protein || 0} g</p>
                                </div>
                                <div className="px-3 py-2 flex flex-col items-center justify-center gap-[2px] bg-orange-100 rounded-md text-orange-500">
                                    <Wheat className="size-4 stroke-orange-400" />
                                    <p className="text-sm">
                                        Carbs
                                    </p>
                                    <p className="text-sm">{selectedServing?.carbohydrate || 0} g</p>
                                </div>
                                <div className="px-3 py-2 flex flex-col items-center justify-center gap-[2px] bg-purple-100 rounded-md text-purple-500">
                                    <Citrus className="size-4 stroke-purple-400" />
                                    <p className="text-sm">
                                        Fats
                                    </p>
                                    <p className="text-sm">{selectedServing?.fat || 0} g</p>
                                </div>
                            </div>

                            {/* FatSecret Servings */}
                            <div className="grid grid-rows-2" onClick={() => {
                                setIsCustomServing(false);
                            }}>
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

                            {/* Custom Serving Input */}
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
                                type="submit"
                                className="w-full mt-2"
                                disabled={isAddingFood}
                            >
                                {isAddingFood ? 'Adding Food...' : 'Add Food'}
                            </Button>
                        </CardContent>
                    </Card>
                </form>
            )}
        </SubLayout>
    );
}

export { AddFoodEntry };