import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api";
import { toast } from "react-hot-toast";

export function useTemplates() {
    const queryClient = useQueryClient();

    // Fetch auth user templates
    const fetchTemplates = useQuery({
        queryKey: ["templates"],
        queryFn: async () => {
            const response = await api.get("workouts/templates/");
            return response.data;
        }
    });

    // Create template with selected exercises
    const createTemplate = useMutation({
        mutationFn: async (templateData) => {
            // Ensure proper structure for backend
            const formattedData = {
                ...templateData,
                exercises: templateData.exercises.map(exercise => ({
                    name: exercise.name,
                    type: exercise.type || '',
                    muscle: exercise.muscle || '',
                    equipment: exercise.equipment || '',
                    difficulty: exercise.difficulty || '',
                    instructions: exercise.instructions || '',
                    sets_data: exercise.sets_data || [],
                    rest_time: exercise.rest_time || null,
                    notes: exercise.notes || ''
                }))
            };

            const response = await api.post("workouts/templates/create_with_exercises/", formattedData);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["templates"] });
            toast.success("Template created successfully!");
        },
        onError: (error) => {
            const errorMessage = error.response?.data?.message || "Failed to create template";
            toast.error(errorMessage);
        }
    });

    // Delete template
    const deleteTemplateMutation = useMutation({
        mutationFn: async (templateId) => {
            await api.delete(`workouts/templates/${templateId}/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["templates"] });
            toast.success("Template deleted successfully!");
        },
        onError: (error) => {
            toast.error(`Error deleting template: ${error.response?.data?.message || error.message}`);
        }
    });

    return {
        // Data
        templates: fetchTemplates.data || [],
        routines: (fetchTemplates.data || []).filter((t) => !t.isAlternative),
        alternatives: (fetchTemplates.data || []).filter((t) => t.isAlternative),

        // Fetching loading states
        isLoading: fetchTemplates.isLoading,
        isDeleting: deleteTemplateMutation.isPending,

        // Create actions
        createTemplate: createTemplate.mutate,
        // Create states
        isCreating: createTemplate.isPending,

        // Delete
        deleteTemplate: deleteTemplateMutation.mutate,
        // Delete states
        isDeleting: deleteTemplateMutation.isPending,
    };
}