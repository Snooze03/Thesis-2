import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/api";
import { toast } from "react-hot-toast";

export function useTemplates() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Get all templates
    const getTemplates = async () => {
        const response = await api.get("workouts/templates/");
        return response.data;
    };

    const templatesQuery = useQuery({
        queryKey: ["templates"],
        queryFn: getTemplates,
    });

    // Delete template
    const deleteTemplate = async (templateId) => {
        await api.delete(`workouts/templates/${templateId}/`);
    };

    const deleteTemplateMutation = useMutation({
        mutationFn: deleteTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["templates"] });
            toast.success("Template deleted successfully!");
        },
        onError: (error) => {
            toast.error(`Error deleting template: ${error.response?.data?.message || error.message}`);
        }
    });

    // Helper functions
    const navigateToCreate = (isAlternative = false) => {
        navigate(
            `/workouts/templates/create?is_alternative=${isAlternative}`,
            { replace: true }
        );
    };

    const navigateToEdit = (templateId) => {
        navigate(`/workouts/templates/${templateId}/edit`);
    };

    const navigateToStart = (templateId) => {
        navigate(`/workouts/templates/${templateId}/start`);
    };

    return {
        // Data
        templates: templatesQuery.data || [],
        routines: (templatesQuery.data || []).filter((t) => !t.isAlternative),
        alternatives: (templatesQuery.data || []).filter((t) => t.isAlternative),

        // Loading states
        isLoading: templatesQuery.isPending,
        isDeleting: deleteTemplateMutation.isLoading,

        // Actions
        deleteTemplate: deleteTemplateMutation.mutate,
        navigateToCreate,
        navigateToEdit,
        navigateToStart,
    };
}