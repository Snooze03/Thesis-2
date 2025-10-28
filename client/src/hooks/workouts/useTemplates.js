import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/api";
import { toast } from "react-hot-toast";

export function useTemplates() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const fetchTemplates = useQuery({
        queryKey: ["templates"],
        queryFn: async () => {
            const response = await api.get("workouts/templates/");
            return response.data;
        }
    });

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

        // Loading states
        isLoading: fetchTemplates.isLoading,
        isDeleting: deleteTemplateMutation.isPending,

        // Actions
        deleteTemplate: deleteTemplateMutation.mutate,
        navigateToStart,
        navigateToSearch,
    };
}