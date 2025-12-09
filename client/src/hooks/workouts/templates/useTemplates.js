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
                    weight_unit: exercise.weight_unit || 'kg',
                    rest_time: formatRestTime(exercise.rest_time),
                    notes: exercise.notes || ''
                }))
            };

            // console.log("Formatted Data for Backend:", formattedData); // Debug log

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
            console.error("Create Template Error:", error.response?.data); // Debug log
        }
    });

    // Update template
    const updateTemplate = useMutation({
        mutationFn: async ({ templateId, templateData }) => {
            const formattedData = {
                ...templateData,
                exercises: templateData.exercises.map(exercise => ({
                    // Include template_exercise_id for existing exercises in edit mode
                    ...(exercise.template_exercise_id && {
                        template_exercise_id: exercise.template_exercise_id
                    }),
                    name: exercise.name,
                    type: exercise.type || '',
                    muscle: exercise.muscle || '',
                    equipment: exercise.equipment || '',
                    difficulty: exercise.difficulty || '',
                    instructions: exercise.instructions || '',
                    sets_data: exercise.sets_data || [],
                    weight_unit: exercise.weight_unit || 'kg',
                    rest_time: formatRestTime(exercise.rest_time),
                    notes: exercise.notes || '',
                    order: exercise.order || 0
                }))
            };

            console.log("Update Formatted Data:", formattedData); // Debug log

            const response = await api.patch(`workouts/templates/${templateId}/`, formattedData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["templates"] });
            toast.success("Template updated successfully!");
        },
        onError: (error) => {
            toast.error(`Error updating template: ${error.response?.data?.message || error.message}`);
            console.log(`Update Template Error:`, error.response?.data); // Debug log
        }
    });

    // Delete template
    const deleteTemplate = useMutation({
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

    // Utility function
    function formatRestTime(seconds) {
        if (!seconds) return null;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return {
        // Data
        templates: fetchTemplates.data || [],
        routines: (fetchTemplates.data || []).filter((t) => !t.isAlternative),
        alternatives: (fetchTemplates.data || []).filter((t) => t.isAlternative),

        // Fetching loading states
        isLoading: fetchTemplates.isLoading,
        isDeleting: deleteTemplate.isPending,

        // Create actions
        createTemplate: createTemplate.mutate,
        // Create states
        isCreating: createTemplate.isPending,

        // Update actions
        updateTemplate: updateTemplate.mutate,
        // Update states
        isUpdating: updateTemplate.isPending,

        // Delete
        deleteTemplate: deleteTemplate.mutate,
        // Delete states
        isDeleting: deleteTemplate.isPending,
    };
}