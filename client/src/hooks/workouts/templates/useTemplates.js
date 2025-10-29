import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/api";
import { toast } from "react-hot-toast";

export function useTemplates() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

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
            const response = await api.post("workouts/templates/create_with_exercises/", templateData);
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

    const navigateToStart = (template) => {
        navigate("/workouts/templates/start", {
            state: {
                template,
                mode: "start"
            }
        });
    };

    const navigateToSearch = (template) => {
        navigate("/workouts/templates/search", {
            state: {
                template,
                mode: "search"
            }
        });
    };

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
        navigateToStart,
        navigateToSearch,
    };
}