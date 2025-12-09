import { useEffect, useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useUpdateFoodEntry, useDeleteFoodEntry } from "@/hooks/nutrition/food/useUpdateFoodEntry";
import { useFoodDatabase } from "@/hooks/nutrition/food/useFoodDatabase";
import { useDietPlan } from "@/hooks/nutrition/diet-plan/useDietPlan";
import { addFoodSchema } from "../add-food/add-food-schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Flame, Beef, Wheat, Citrus, Utensils, RefreshCcw, Trash } from "lucide-react";
import { toast } from "react-hot-toast";
import clsx from "clsx";

const MEALS = ["breakfast", "lunch", "dinner", "snack"];
const SERVING_SIZES = ["g (grams)", "oz (ounces)", "ml (milliliters)"];

export function FoodDetailsDialog({ isOpen, onClose, entryId, foodDatabaseId, mealItemId, isDietPlan = false }) {
    const [isCustomServing, setIsCustomServing] = useState(false);

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
        foodDetails,
        foodServings: servings,
        isLoading,
        isError,
        error,
    } = useFoodDatabase(foodDatabaseId);

    // Watch form values for UI updates
    const selectedServingId = watch("selectedServingId");
    const customAmount = watch("customAmount");
    const customUnit = watch("customUnit");
    const selectedMeal = watch("selectedMeal");

    // Memoize selected serving calculation
    const selectedServing = useMemo(() => {
        return selectedServingId
            ? servings.find(serving => serving.serving_id === selectedServingId)
            : servings[0];
    }, [selectedServingId, servings]);

    // Reset form and set default serving when dialog opens or foodDatabaseId changes
    useEffect(() => {
        if (isOpen && servings.length > 0) {
            reset({
                selectedServingId: servings[0].serving_id,
                customAmount: "",
                customUnit: "",
                selectedMeal: ""
            });
            setIsCustomServing(false);
        }
    }, [isOpen, foodDatabaseId, servings, reset]);

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

    // ===== MUTATIONS =====
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

    const {
        updateFoodItem: { mutate: updateDietPlanFoodItem },
        deleteMealItem: { mutate: deleteDietPlanMealItem },
    } = useDietPlan({
        onSuccess: () => {
            onClose();
        }
    });
    // ===== END MUTATIONS =====

    // Memoize loading state
    const isProcessing = useMemo(() =>
        isUpdatingFoodEntry || isDeletingFoodEntry,
        [isUpdatingFoodEntry, isDeletingFoodEntry]
    );

    // ===== MEMOIZED HANDLERS =====
    const onSubmit = useCallback((formData) => {
        const servingData = isCustomServing
            ? {
                serving_type: "custom",
                custom_serving_amount: parseFloat(formData.customAmount),
                custom_serving_unit: formData.customUnit,
                fatsecret_serving_id: null,
            }
            : {
                serving_type: "fatsecret",
                fatsecret_serving_id: formData.selectedServingId,
                custom_serving_amount: null,
                custom_serving_unit: null,
            };

        const updateData = {
            ...servingData,
            meal_type: formData.selectedMeal.toLowerCase(),
        };

        if (isDietPlan) {
            // Use mealItemId for updating diet plan meal items
            updateDietPlanFoodItem({
                mealItemId: mealItemId,
                updateData
            });
        } else {
            updateFoodEntry({
                foodEntryId: entryId,
                updateData
            });
            console.log(`Updating Entry ID: ${entryId} with Data:`, updateData);
        }
    }, [isDietPlan, foodDatabaseId, entryId, mealItemId, updateDietPlanFoodItem, updateFoodEntry, isCustomServing]);

    const handleDeleteEntry = useCallback(() => {
        if (isDietPlan) {
            deleteDietPlanMealItem(mealItemId);
        } else {
            deleteFoodEntry(entryId);
        }
    }, [isDietPlan, deleteDietPlanMealItem, deleteFoodEntry, entryId, mealItemId]);

    const toggleCustomServing = useCallback((value) => {
        setIsCustomServing(value);
        if (!value) {
            setValue("customAmount", "");
            setValue("customUnit", "");
        }
    }, [setValue]);
    // ===== END MEMOIZED HANDLERS =====

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
                        <MacroCards selectedServing={selectedServing} />

                        {/* FatSecret Servings */}
                        <div className="space-y-2" onClick={() => toggleCustomServing(false)}>
                            <SectionHeader
                                title="Serving Options"
                                isActive={!isCustomServing}
                            />
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
                                            {serving.serving_description.length > 5 ? (
                                                <span>{serving.serving_description} • ({serving.metric_serving_amount} {serving.metric_serving_unit})</span>
                                            ) : (
                                                <span>{serving.metric_serving_amount} {serving.metric_serving_unit}</span>
                                            )}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Custom Serving Input */}
                        <div className="space-y-2" onClick={() => toggleCustomServing(true)}>
                            <SectionHeader
                                title="Custom Serving"
                                isActive={isCustomServing}
                            />
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
                                        {SERVING_SIZES.map((size, index) => (
                                            <SelectItem key={index} value={size}>
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Meal Selection */}
                        <div className="space-y-2">
                            <SectionHeader title="Add to Meal" isActive={true} />
                            <Select
                                onValueChange={(value) => setValue("selectedMeal", value)}
                                value={selectedMeal}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select meal" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MEALS.map((mealItem, index) => (
                                        <SelectItem key={index} value={mealItem}>
                                            {mealItem.charAt(0).toUpperCase() + mealItem.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter className="flex gap-2 pt-4">
                            {!isDietPlan && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleDeleteEntry}
                                    disabled={isProcessing}
                                >
                                    <Trash className="size-4" />
                                    {isDeletingFoodEntry ? 'Deleting...' : 'Delete Food'}
                                </Button>
                            )}
                            <Button
                                type="submit"
                                disabled={isProcessing}
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

// Extracted components for better performance
const MacroCards = ({ selectedServing }) => {
    const macros = useMemo(() => [
        {
            icon: <Flame className="size-4 stroke-primary" />,
            label: "Calories",
            value: selectedServing?.calories || 0,
            unit: "",
            bgColor: "bg-primary-100",
            textColor: "text-gray-700"
        },
        {
            icon: <Beef className="size-4 stroke-green-400" />,
            label: "Protein",
            value: selectedServing?.protein || 0,
            unit: "g",
            bgColor: "bg-green-100",
            textColor: "text-green-500"
        },
        {
            icon: <Wheat className="size-4 stroke-orange-400" />,
            label: "Carbs",
            value: selectedServing?.carbohydrate || 0,
            unit: "g",
            bgColor: "bg-orange-100",
            textColor: "text-orange-500"
        },
        {
            icon: <Citrus className="size-4 stroke-purple-400" />,
            label: "Fats",
            value: selectedServing?.fat || 0,
            unit: "g",
            bgColor: "bg-purple-100",
            textColor: "text-purple-500"
        }
    ], [selectedServing]);

    return (
        <div className="grid grid-cols-4 gap-3">
            {macros.map((macro, index) => (
                <div
                    key={index}
                    className={`px-3 py-2 flex flex-col items-center justify-center gap-[2px] ${macro.bgColor} rounded-md ${macro.textColor}`}
                >
                    {macro.icon}
                    <p className="text-xs">{macro.label}</p>
                    <p className="text-sm font-medium">
                        {macro.value}{macro.unit}
                    </p>
                </div>
            ))}
        </div>
    );
};

const SectionHeader = ({ title, isActive }) => (
    <div className="flex items-center justify-between gap-4">
        <p className={clsx(
            "text-sm",
            { "text-gray-600": !isActive },
            { "font-semibold": isActive }
        )}>
            {title}
        </p>
        <Separator className="h-px flex-1 bg-border" />
    </div>
);