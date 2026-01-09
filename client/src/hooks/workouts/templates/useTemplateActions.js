import api from "@/api";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

/**
 * Hook for saving a completed workout and fetching workout history
 */
export function useTemplateActions() {
    const queryClient = useQueryClient();

    const saveTemplate = useMutation({
        mutationFn: async ({ templateData }) => {
            // Format workout data before sending to API
            const formattedData = {
                template_id: templateData.template_id,
                template_title: templateData.template_title.trim(),
                started_at: templateData.started_at,
                completed_at: templateData.completed_at,
                workout_notes: templateData.workout_notes || '',
                completed_exercises: templateData.completed_exercises.map((exercise, index) => ({
                    exercise_name: exercise.exercise_name,
                    performed_sets_data: exercise.performed_sets_data.map(set => ({
                        reps: set.reps,
                        weight: set.weight
                    })),
                    weight_unit: exercise.weight_unit || 'kg',
                    exercise_notes: exercise.exercise_notes || '',
                    order: exercise.order ?? index
                }))
            };

            const response = await api.post("workouts/templates/save_completed_workout/", formattedData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workoutHistory"] });
            toast.success("Workout Completed!")
        },
        onError: (error) => {
            console.error("Error saving template:", error);
        }
    })

    const fetchWorkoutHistory = useQuery({
        queryKey: ["workoutHistory"],
        queryFn: async () => {
            const response = await api.get("workouts/history/");
            return response.data;
        },
        // onSuccess: (data) => {
        //     console.log("Fetched workout history:");
        // },
        onError: (error) => {
            console.log(`Error fetching workouts history: ${error}`);
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 30 * 60 * 1000, // 30 minutes
    })

    return {
        // For saving a completed workout template
        saveTemplate: saveTemplate.mutate,
        // State
        isSaving: saveTemplate.isPending,

        // Fetching workout history
        workoutHistory: fetchWorkoutHistory.data,
        // state
        isFetchingHistory: fetchWorkoutHistory.isLoading,
    }
}