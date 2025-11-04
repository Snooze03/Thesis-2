import api from "@/api";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

/**
 * Hook for saving a completed workout and fetching workout history
 */
export function useTemplateActions() {
    const saveTemplate = useMutation({
        mutationFn: async ({ templateData }) => {
            const response = await api.post("workouts/templates/save_completed_workout/", templateData);
            return response.data;
        },
        onSuccess: () => {
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