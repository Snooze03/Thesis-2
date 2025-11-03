import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '@/api';

/**
 * Hook for adding food to master database and daily entry
 * Handles the two-step process: import food -> add to daily entry
 */
export const useAddFoodToDailyEntry = (options = {}) => {
    const addFoodToDailyEntry = useMutation({
        mutationFn: async ({ foodData, entryData }) => {
            try {
                // Step 1: Import food to master database (if not yet added)
                const importResponse = await api.post('/nutrition/foods-db/import_from_fatsecret/', {
                    food_id: foodData.food_id,
                    food_name: foodData.food_name,
                    food_type: foodData.food_type ? foodData.food_type : 'Generic',
                    brand_name: foodData.brand_name ? foodData.brand_name : '',
                    food_description: foodData.food_description ? foodData.food_description : '',
                    fatsecret_servings: foodData.servings
                });

                // console.log('Step 1 Response:', importResponse.data);

                // Step 2: Add food entry to daily entry
                const foodEntryPayload = {
                    daily_entry: entryData.daily_entry,
                    food: importResponse.data.food.id,
                    meal_type: entryData.meal_type,
                    serving_type: entryData.serving_type,
                    fatsecret_serving_id: entryData.fatsecret_serving_id,
                    custom_serving_unit: entryData.custom_serving_unit,
                    custom_serving_amount: entryData.custom_serving_amount,
                    quantity: entryData.quantity || 1,
                };

                // console.log('Step 2: Adding food entry with payload:', foodEntryPayload);

                const foodEntryResponse = await api.post('/nutrition/food-entries/', foodEntryPayload);

                // console.log('Step 2 Response:', foodEntryResponse.data);

                return {
                    food: importResponse.data,
                    foodEntry: foodEntryResponse.data
                };
            } catch (error) {
                console.error('Detailed error in step:', error.response?.status);
                console.error('Error response data:', error.response?.data);
                console.error('Error config:', error.config);
                throw error;
            }
        },
        onSuccess: (data) => {
            // Custom onSuccess handler
            if (options.onSuccess) {
                options.onSuccess(data);
            }
        },
        onError: (error) => {
            console.error('Error adding food to daily entry:', error);
            toast.error(
                error.response?.data?.message ||
                'Failed to add food. Please try again.'
            );

            if (options.onError) {
                options.onError(error);
            }
        }
    });

    return {
        // Mutation action
        addFood: addFoodToDailyEntry.mutate,
        addFoodAsync: addFoodToDailyEntry.mutateAsync,

        // Mutation States
        isLoading: addFoodToDailyEntry.isPending,
        isError: addFoodToDailyEntry.isError,
        error: addFoodToDailyEntry.error,
        isSuccess: addFoodToDailyEntry.isSuccess
    };
};
