import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAddFoodToDailyEntry } from "@/hooks/nutrition/food/useAddFoodToDailyEntry";
import { useDailyEntry } from "@/hooks/nutrition/useDailyEntry";
import { useFatSecretSearch } from "@/hooks/nutrition/useFatSecretSearch";
import { useDietPlan } from "@/hooks/nutrition/diet-plan/useDietPlan";
import { AddFoodForm } from "./food-form";
import { SubLayout } from "@/layouts/sub-layout";
import { toast } from "react-hot-toast";

function AddFoodEntry() {
    const navigate = useNavigate();
    const { useFoodDetails } = useFatSecretSearch();
    const location = useLocation();
    const queryClient = useQueryClient();
    const foodId = location.state?.foodId;
    const isDietPlan = location.state?.isDietPlan;
    const dietPlanId = location.state?.dietPlanId;

    // Fetch food details
    const {
        data: foodData,
        isLoading,
        isError,
    } = useFoodDetails(foodId);

    // Get today's daily entry ID
    const { data: todayDailyEntryID } = useDailyEntry();

    // Add food mutation
    const {
        addFood,
        isLoading: isAddingFood
    } = useAddFoodToDailyEntry({
        onSuccess: () => {
            toast.success('Food added successfully!');

            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['foodEntries'] });
            queryClient.invalidateQueries({ queryKey: ['todayDailyEntry'] });
            queryClient.invalidateQueries({ queryKey: ['dailyEntriesHistory'] });

            navigate(-1, { replace: true });
        }
    });

    // Add Food to diet plan mutation
    const {
        addFoodToDietPlan: {
            mutate: addFoodToDietMutate,
            isLoading: isAddingToDietPlan
        }
    } = useDietPlan({
        onSuccess: () => {
            toast.success('Food added to diet plan successfully!');
            queryClient.invalidateQueries({ queryKey: ['diet-plan'] });
            navigate(-1, { replace: true });
        }
    });

    // Form submission handler
    const handleSubmit = ({ foodData, entryData }) => {
        if (isDietPlan) {
            const payload = {
                dietPlanId: dietPlanId,
                foodData,
                entryData: { ...entryData }
            };

            addFoodToDietMutate(payload);
        }
        else {
            const payload = {
                foodData,
                entryData: {
                    ...entryData,
                    daily_entry: todayDailyEntryID.id
                }
            };

            addFood(payload);
        }
    };

    return (
        <SubLayout>
            <AddFoodForm
                foodData={foodData}
                onSubmit={handleSubmit}
                isSubmitting={isAddingFood || isAddingToDietPlan}
                isLoading={isLoading}
                isError={isError}
                showMealSelection={true}
            >
                <AddFoodForm.Header
                    showBackButton={true}
                    onBack={() => navigate(-1)}
                >
                    <h1 className="font-bold">Back to Search</h1>
                </AddFoodForm.Header>

                <AddFoodForm.Card>
                    <AddFoodForm.Nutrition />
                    <AddFoodForm.Servings />
                    <AddFoodForm.CustomServing />
                    {/* <AddFoodForm.Quantity /> */}
                    <AddFoodForm.MealSelection />
                    <AddFoodForm.SubmitButton />
                </AddFoodForm.Card>
            </AddFoodForm>
        </SubLayout>
    );
}

export { AddFoodEntry };