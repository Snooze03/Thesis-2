import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useFatSecretSearch } from "@/hooks/nutrition/useFatSecretSearch";
import { useUpdateFoodEntry, useDeleteFoodEntry } from "@/hooks/nutrition/food/useUpdateFoodEntry";
import { useFoodDatabase } from "@/hooks/nutrition/food/useFoodDatabase";
import { addFoodSchema } from "../add-food/add-food-schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Flame, Beef, Wheat, Citrus, Utensils, RefreshCcw } from "lucide-react";
import { toast } from "react-hot-toast";
import clsx from "clsx";
import { Trash } from "lucide-react";

export function FoodEntryDetails({ isOpen, onClose, entryId, foodDatabaseId }) {
    const { useFoodDetails } = useFatSecretSearch();
    const queryClient = useQueryClient();
    const [isCustomServing, setIsCustomServing] = useState(false);
    const meal = ["breakfast", "lunch", "dinner", "snack"];
    const servingSizes = ["g (grams)", "oz (ounces)", "ml (milliliters)"];

    // console.log(`Food DB ID ${foodDatabaseId} for Food ID ${foodId} in Entry ID ${entryId}`);

    // ===== FORM HANDLER =====
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
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
        foodData,
        isLoading,
        isError,
        error,
    } = useFoodDatabase(foodDatabaseId);

    // get data from json response
    const foodDetails = foodData;
    console.log(`Food Details: `, foodDetails);
    const foodServings = foodData?.fatsecret_servings;
    const servings = Array.isArray(foodServings) ? foodServings : [];

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

    // Reset form when dialog closes
    useEffect(() => {
        if (!isOpen) {
            reset();
            setIsCustomServing(false);
        }
    }, [isOpen, reset]);

    // Show validation errors as toasts
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const firstError = Object.values(errors)[0];
            toast.error(firstError.message);
        }
    }, [errors]);

    const {
        updateFoodEntry,
        isUpdatingFoodEntry,
    } = useUpdateFoodEntry({
        onSuccess: () => {
            onClose();
        }
    });

    const {
        deleteFoodEntry,
        isDeletingFoodEntry,
    } = useDeleteFoodEntry({
        onSuccess: () => {
            onClose();
        },
        onError: () => {
            onClose();
        }
    });

    // ===== FORM SUBMISSION HANDLER =====
    const onSubmit = (formData) => {
        const updateData = {
            meal_type: formData.selectedMeal,
            serving_type: "fatsecret",
            fatsecret_serving_id: formData.selectedServingId || (servings[0] ? servings[0].serving_id : null),
            custom_serving_unit: formData.customUnit || null,
            custom_serving_amount: formData.customAmount || null,
            quantity: 1,
        };

        updateFoodEntry({ foodEntryId: entryId, updateData });
    };
    // ==== END FORM SUBMISSION HANDLER =====

    const handleDeleteEntry = () => {
        deleteFoodEntry(entryId);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Utensils className="size-5" />
                        {foodDetails?.food_name || "Food Details"}
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                        {foodDetails?.brand_name
                            ? `${foodDetails.brand_name} - View nutritional information and edit`
                            : "View nutritional information and edit this food"
                        }
                    </DialogDescription>
                </DialogHeader>

                {isLoading && (
                    <div className="py-8">
                        <LoadingSpinner message="food details..." />
                    </div>
                )}

                {!isLoading && foodDetails && (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Food macros */}
                        <div className="grid grid-cols-4 gap-3">
                            <div className="px-3 py-2 flex flex-col items-center justify-center gap-[2px] bg-primary-100 rounded-md text-gray-700">
                                <Flame className="size-4 stroke-primary" />
                                <p className="text-xs">Calories</p>
                                <p className="text-sm font-medium">{selectedServing?.calories || 0}</p>
                            </div>
                            <div className="px-3 py-2 flex flex-col items-center justify-center gap-[2px] bg-green-100 rounded-md text-green-500">
                                <Beef className="size-4 stroke-green-400" />
                                <p className="text-xs">Protein</p>
                                <p className="text-sm font-medium">{selectedServing?.protein || 0} g</p>
                            </div>
                            <div className="px-3 py-2 flex flex-col items-center justify-center gap-[2px] bg-orange-100 rounded-md text-orange-500">
                                <Wheat className="size-4 stroke-orange-400" />
                                <p className="text-xs">Carbs</p>
                                <p className="text-sm font-medium">{selectedServing?.carbohydrate || 0} g</p>
                            </div>
                            <div className="px-3 py-2 flex flex-col items-center justify-center gap-[2px] bg-purple-100 rounded-md text-purple-500">
                                <Citrus className="size-4 stroke-purple-400" />
                                <p className="text-xs">Fats</p>
                                <p className="text-sm font-medium">{selectedServing?.fat || 0} g</p>
                            </div>
                        </div>

                        {/* FatSecret Servings */}
                        <div className="space-y-2" onClick={() => setIsCustomServing(false)}>
                            <div className="flex items-center justify-between gap-4">
                                <p className={clsx(
                                    "text-sm",
                                    { "text-gray-600": isCustomServing },
                                    { "font-semibold": !isCustomServing },
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
                        <div className="space-y-2" onClick={() => setIsCustomServing(true)}>
                            <div className="flex items-center justify-between gap-4">
                                <p className={clsx(
                                    "text-sm",
                                    { "text-gray-600": !isCustomServing },
                                    { "font-semibold": isCustomServing },
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
                                        <SelectValue placeholder="Unit" />
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
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-4">
                                <p className="text-sm font-semibold">Add to Meal</p>
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

                        <DialogFooter className="flex gap-2 pt-4">
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDeleteEntry}
                                disabled={isUpdatingFoodEntry}
                            >
                                <Trash className="size-4" />
                                Delete
                            </Button>
                            <Button
                                type="submit"
                                disabled={isUpdatingFoodEntry}
                                className="flex-1"
                            >
                                <RefreshCcw className="size-4" />
                                {isUpdatingFoodEntry ? 'Updating...' : 'Update Food'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}