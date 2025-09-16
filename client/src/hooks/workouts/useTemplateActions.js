import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import api from "@/api";
import { toast } from "react-hot-toast";

export function useTemplateActions() {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();

    const [title, setTitle] = useState("");
    const [localTitle, setLocalTitle] = useState("");
    const [isInitialized, setIsInitialized] = useState(false); // Add this flag

    // Get state from navigation
    const { template, isAlternative = false, mode } = location.state || {};

    // Fix: Ensure isEditing is always a boolean
    const isEditing = Boolean(mode === "edit" && template?.id);
    const templateId = template?.id;

    // Get existing template (if editing)
    const getTemplate = async () => {
        if (!templateId) return null;
        const response = await api.get(`workouts/templates/${templateId}/`);
        return response.data;
    };

    const existingTemplateQuery = useQuery({
        queryKey: ["template_edit", templateId],
        queryFn: getTemplate,
        enabled: Boolean(isEditing && templateId),
    });

    // Create template
    const createTemplate = async (template_title) => {
        const response = await api.post("workouts/templates/", {
            title: template_title,
            isAlternative: isAlternative
        });
        return response.data;
    };

    // Update template
    const updateTemplate = async ({ id, title }) => {
        const response = await api.patch(`workouts/templates/${id}/`, { title });
        return response.data;
    };

    const templateMutation = useMutation({
        mutationFn: isEditing ? updateTemplate : createTemplate,
        onSuccess: (templateData) => {
            if (isEditing) {
                // Update template title and navigate back to workouts
                setTitle(templateData.title);
                queryClient.invalidateQueries({ queryKey: ["templates"] });
                queryClient.invalidateQueries({ queryKey: ["template_edit", templateId] });
                navigate("/workouts", { replace: true });
                toast.success("Template updated successfully!");
            } else {
                // Navigate to search with the newly created template
                navigate("/workouts/templates/search", {
                    state: {
                        template: templateData,
                        mode: "search"
                    }
                });
            }
        },
        onError: (error) => {
            const errorMessage = error.response?.data?.message || error.message;
            toast.error(`Error: ${errorMessage}`);
        }
    });

    // Delete template (for cleanup)
    const deleteTemplate = async (templateId) => {
        await api.delete(`workouts/templates/${templateId}/`);
    };

    const deleteTemplateMutation = useMutation({
        mutationFn: deleteTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["templates"] });
        },
        onError: (error) => {
            console.log("Error deleting template:", error);
        }
    });

    // Sync local title with template data - ONLY ONCE on initial load
    useEffect(() => {
        if (!isInitialized) {
            if (isEditing && template) {
                setTitle(template.title);
                setLocalTitle(template.title);
                setIsInitialized(true);
            } else if (existingTemplateQuery.data) {
                const fetchedTitle = existingTemplateQuery.data.title;
                setTitle(fetchedTitle);
                setLocalTitle(fetchedTitle);
                setIsInitialized(true);
            }
        }
    }, [template, existingTemplateQuery.data, isEditing, isInitialized]);

    // Redirect if no state is provided
    useEffect(() => {
        if (!location.state) {
            navigate("/workouts", { replace: true });
        }
    }, [location.state, navigate]);

    // Event handlers
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!localTitle.trim()) {
            toast.error("Template title is required");
            return;
        }

        if (isEditing) {
            templateMutation.mutate({ id: templateId, title: localTitle });
        } else {
            templateMutation.mutate(localTitle);
        }
    };

    const handleAddExercise = () => {
        // If we're creating a new template and don't have a template_id yet
        if (!isEditing && !localTitle.trim()) {
            return toast.error("Enter a template title first");
        }

        if (!isEditing) {
            // Create template first, then navigate (handled in onSuccess)
            templateMutation.mutate(localTitle);
        } else {
            // Navigate to search with template state
            navigate("/workouts/templates/search", {
                state: {
                    template,
                    mode: "search"
                }
            });
        }
    };

    const handleCancel = async () => {
        try {
            // Check if we need to delete empty template
            const exercises = queryClient.getQueryData(["template_exercises", templateId]);
            if (isEditing && exercises && exercises.length === 0) {
                await new Promise((resolve) => setTimeout(resolve, 350));
                deleteTemplateMutation.mutate(templateId);
            }
        } catch (err) {
            console.log(err);
        } finally {
            navigate("/workouts", { replace: true });
        }
    };

    const handleDeleteTemplate = () => {
        if (window.confirm("Are you sure you want to delete this template?")) {
            deleteTemplateMutation.mutate(templateId);
            navigate("/workouts", { replace: true });
        }
    };

    return {
        // State
        title,
        setTitle,
        localTitle,
        setLocalTitle,
        isEditing,
        isAlternative,
        template,

        // Template data
        existingTemplate: existingTemplateQuery.data,

        // Loading states
        isLoadingTemplate: existingTemplateQuery.isLoading,
        isSaving: templateMutation.isLoading,
        isDeleting: deleteTemplateMutation.isLoading,

        // Error states
        isError: existingTemplateQuery.isError,

        // Actions
        handleSubmit,
        handleAddExercise,
        handleCancel,
        handleDeleteTemplate,

        // Direct mutation access if needed
        saveTemplate: templateMutation.mutate,
        deleteTemplate: deleteTemplateMutation.mutate,
    };
}