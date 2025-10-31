import api from "@/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function useDietPlan(options = {}) {
    const queryClient = useQueryClient();

    const fetchDietPlan = useQuery({
        queryKey: ['diet-plan'],
        queryFn: async () => {
            const response = await api.get('/nutrition/diet-plans/');
            return response.data;
        },
        onSuccess: (data) => {
            console.log(`Fetched diet plan data ${data}`);
        },
        onError: (error) => {
            console.error('Error fetching diet plan:', error);
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
        cacheTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    });

    const addFoodToDietPlan = useMutation({
        mutationFn: async ({ dietPlanId, foodData, entryData }) => {
            try {
                const importResponse = await api.post('/nutrition/foods-db/import_from_fatsecret/', {
                    food_id: foodData.food_id,
                    food_name: foodData.food_name,
                    food_type: foodData.food_type || '',
                    brand_name: foodData.brand_name || '',
                    food_description: foodData.food_description || '',
                    fatsecret_servings: foodData.servings || []
                });

                const payload = {
                    diet_plan: dietPlanId,
                    food: importResponse.data.food.id,
                    meal_type: entryData.meal_type,
                    serving_type: entryData.serving_type,
                    fatsecret_serving_id: entryData.fatsecret_serving_id || null,
                    custom_serving_unit: entryData.custom_serving_unit || null,
                    custom_serving_amount: entryData.custom_serving_amount || null,
                    quantity: entryData.quantity || 1,
                    order: entryData.order || 0
                };

                const response = await api.post('/nutrition/meal-items/', payload);
                return response.data;
            } catch (error) {
                console.error('Detailed error in step:', error.response?.status);
                console.error('Error response data:', error.response?.data);
                console.error('Error config:', error.config);
                throw error;
            }

        },
        onSuccess: (data) => {
            if (options.onSuccess) {
                options.onSuccess(data);
            }
        }
    });

    const deleteMealItem = useMutation({
        mutationFn: async (mealItemId) => {
            const response = await api.delete(`/nutrition/meal-items/${mealItemId}/`);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Meal item deleted successfully!');
            queryClient.invalidateQueries({ queryKey: ['diet-plan'] });
        }
    });

    const addFoodToDailyEntry = useMutation({
        mutationFn: async ({ dailyEntryId, foodId, entryData }) => {
            const foodEntryPayload = {
                daily_entry: dailyEntryId,
                food: foodId,
                meal_type: entryData.meal_type,
                serving_type: entryData.serving_type,
                fatsecret_serving_id: entryData.fatsecret_serving_id,
                custom_serving_unit: entryData.custom_serving_unit,
                custom_serving_amount: entryData.custom_serving_amount,
                quantity: entryData.quantity || 1,
            };

            const response = await api.post('/nutrition/food-entries/', foodEntryPayload);
            return response.data;
        },
        onSuccess: (data) => {
            toast.success('Food added to daily entry successfully!');

            queryClient.invalidateQueries({ queryKey: ['foodEntries'] });
            queryClient.invalidateQueries({ queryKey: ['todayDailyEntry'] });
            queryClient.invalidateQueries({ queryKey: ['dailyEntriesHistory'] });
        }
    });

    const updateFoodItem = useMutation({
        mutationFn: async ({ mealItemId, updateData }) => {
            const response = await api.patch(`/nutrition/meal-items/${mealItemId}/`, updateData);
            return response.data;
        },
        onSuccess: (data) => {
            toast.success('Meal item updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['diet-plan'] });
            if (options.onSuccess) {
                options.onSuccess(data);
            }
        }
    })

    return {
        fetchDietPlan,
        addFoodToDietPlan,
        deleteMealItem,
        addFoodToDailyEntry,
        updateFoodItem,
    }
}