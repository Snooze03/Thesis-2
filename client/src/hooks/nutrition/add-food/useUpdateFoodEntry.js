import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '@/api';

/**
 * Hook for updating an existing food entry in daily entry
 * Handles updating quantity, serving type, or meal type
 */
export const useUpdateFoodEntry = (options = {}) => {
    const updateFoodEntry = useMutation({
        mutationFn: async ({ foodEntryId, updateData }) => {
            try {
                // console.log('Updating food entry:', foodEntryId, 'with data:', updateData);

                // Update the existing food entry
                const response = await api.patch(`/nutrition/food-entries/${foodEntryId}/`, updateData);

                // console.log('Update response:', response.data);

                return response.data;
            } catch (error) {
                console.error('Detailed error updating food entry:', error.response?.status);
                console.error('Error response data:', error.response?.data);
                console.error('Error config:', error.config);
                throw error;
            }
        },
        onSuccess: (data) => {
            toast.success('Food entry updated successfully!');

            // Custom onSuccess handler
            if (options.onSuccess) {
                options.onSuccess(data);
            }
        },
        onError: (error) => {
            console.error('Error updating food entry:', error);
            toast.error(
                error.response?.data?.message ||
                error.response?.data?.detail ||
                'Failed to update food entry. Please try again.'
            );

            if (options.onError) {
                options.onError(error);
            }
        }
    });

    return {
        // Mutation actions
        updateFoodEntry: updateFoodEntry.mutate,
        updateFoodAsync: updateFoodEntry.mutateAsync,

        // Mutation states
        isLoading: updateFoodEntry.isPending,
        isError: updateFoodEntry.isError,
        error: updateFoodEntry.error,
        isSuccess: updateFoodEntry.isSuccess
    };
};

export const useDeleteFoodEntry = (options = {}) => {
    const deleteFoodEntry = useMutation({
        mutationFn: async (foodEntryId) => {
            await api.delete(`/nutrition/food-entries/${foodEntryId}/`);
        },
        onSuccess: () => {
            toast.success('Food entry deleted successfully!');

            if (options.onSuccess) {
                options.onSuccess(data);
            }
        },
        onError: (error) => {
            toast.error(
                error.response?.data?.message ||
                error.response?.data?.detail ||
                'Failed to delete food entry. Please try again.'
            );

            if (options.onError) {
                options.onError(data);
            }
        }
    });

    return ({
        deleteFoodEntry: deleteFoodEntry.mutate,
        isDeleting: deleteFoodEntry.isPending,
    })
}