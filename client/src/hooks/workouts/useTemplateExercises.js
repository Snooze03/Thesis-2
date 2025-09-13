import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api";
import { toast } from "react-hot-toast";

export function useTemplateExercises(templateId) {
    const queryClient = useQueryClient();

    // Get template exercises
    const getTemplateExercises = async () => {
        if (!templateId) return [];
        const response = await api.get(`workouts/templates/${templateId}/exercises/`);
        return response.data;
    };

    const exercisesQuery = useQuery({
        queryKey: ["template_exercises", templateId],
        queryFn: getTemplateExercises,
        enabled: Boolean(templateId),
        refetchOnWindowFocus: true,
        staleTime: 0
    });

    // Remove exercise from template
    const removeExerciseFromTemplate = async ({ templateId, exerciseId }) => {
        const response = await api.delete(`workouts/templates/${templateId}/remove_exercise/`, {
            data: { exercise_id: exerciseId }
        });
        return response.data;
    };

    const removeExerciseMutation = useMutation({
        mutationFn: removeExerciseFromTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["template_exercises"] });
        },
        onError: (error) => {
            toast.error(`Error removing exercise: ${error.response?.data?.error || error.message}`);
        }
    });

    // Update exercise sets
    const updateExerciseSet = async ({ template_exercise_ID, newSet }) => {
        if (newSet === 0) {
            toast.error("Cannot have zero sets!");
            return;
        }
        const response = await api.post(`/workouts/template-exercises/${template_exercise_ID}/set_params/`, { sets: newSet });
        return response.data;
    };

    const updateSetMutation = useMutation({
        mutationFn: updateExerciseSet,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["template_exercises"] });
        },
        onError: (error) => {
            toast.error(`Error updating set: ${error.response?.data?.error || error.message}`);
        }
    });

    return {
        // Data
        exercises: exercisesQuery.data || [],

        // Loading states
        isLoading: exercisesQuery.isLoading,
        isError: exercisesQuery.isError,
        isRemoving: removeExerciseMutation.isLoading,
        isUpdating: updateSetMutation.isLoading,

        // Actions
        removeExercise: removeExerciseMutation.mutate,
        updateSets: updateSetMutation.mutate,
        refetch: exercisesQuery.refetch,
    };
}