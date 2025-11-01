import api from "@/api";
import { useQuery, useMutation } from "@tanstack/react-query";

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
            console.log("Template saved successfully");
        },
        onError: (error) => {
            console.error("Error saving template:", error);
        }
    })

    return {
        saveTemplate: saveTemplate.mutate,
        isSaving: saveTemplate.isPending,
    }
}