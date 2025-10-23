import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '@/api';

/**
 * Hook for updating/deleting an existing food entry in daily entry
 * Handles updating serving type, or meal type
 */
export const useUpdateFoodEntry = (options = {}) => {
    const queryClient = useQueryClient();

    const updateFoodEntry = useMutation({
        mutationFn: async ({ foodEntryId, updateData }) => {
            const response = await api.patch(`/nutrition/food-entries/${foodEntryId}/`, updateData);
            return response.data;
        },
        onSuccess: (data) => {
            toast.success('Food entry updated successfully!');

            queryClient.invalidateQueries({
                queryKey: ['foodEntries', 'todayDailyEntry', 'dailyEntriesHistory']
            });

            // Custom onSuccess handler
            if (options.onSuccess) {
                options.onSuccess(data);
            }
        },
        onError: (error) => {
            console.error('Error updating food entry:', error);

            if (options.onError) {
                options.onError(error);
            }
        }
    });

    return {
        // Mutation 
        updateFoodEntry: updateFoodEntry.mutate,

        // States
        isUpdatingFoodEntry: updateFoodEntry.isPending,
        isError: updateFoodEntry.isError,
        error: updateFoodEntry.error,
        isSuccess: updateFoodEntry.isSuccess
    };
};

export const useDeleteFoodEntry = (options = {}) => {
    const queryClient = useQueryClient();

    const deleteFoodEntry = useMutation({
        mutationFn: async (foodEntryId) => {
            const response = await api.delete(`/nutrition/food-entries/${foodEntryId}/`);
            return response.data;
        },
        onSuccess: (data) => {
            toast.success('Food entry deleted successfully!');

            queryClient.invalidateQueries({
                queryKey: ['foodEntries', 'todayDailyEntry', 'dailyEntriesHistory']
            });

            if (options.onSuccess) {
                options.onSuccess(data);
            }
        },
        onError: (error) => {
            console.error('Error deleting food entry:', error);
            toast.error(
                error.response?.data?.message ||
                error.response?.data?.detail ||
                'Failed to delete food entry. Please try again.'
            );

            if (options.onError) {
                options.onError(error);
            }
        }
    });

    return {
        // Mutation
        deleteFoodEntry: deleteFoodEntry.mutate,

        // States
        isDeletingFoodEntry: deleteFoodEntry.isPending,
        isError: deleteFoodEntry.isError,
        error: deleteFoodEntry.error,
    };
};