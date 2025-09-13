import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "@/api";
import { toast } from "react-hot-toast";

export function useTemplateActions() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const { template_id } = useParams();

    const [title, setTitle] = useState("");
    const [localTitle, setLocalTitle] = useState("");

    const isAlternative = searchParams.get("is_alternative") === "true";
    const isEditing = Boolean(template_id);

    // Get existing template (if editing)
    const getTemplate = async () => {
        if (!template_id) return null;
        const response = await api.get(`workouts/templates/${template_id}/`);
        return response.data;
    };

    const existingTemplateQuery = useQuery({
        queryKey: ["template_exercises_edit", template_id],
        queryFn: getTemplate,
        enabled: isEditing,
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
                queryClient.invalidateQueries({ queryKey: ["template_exercises_edit", template_id] });
                navigate("/workouts", { replace: true });
                toast.success("Template updated successfully!");
            } else {
                // Navigate to search with the newly created template
                navigate(`/workouts/templates/${templateData.id}/search`);
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

    // Sync local title with fetched template
    useEffect(() => {
        if (existingTemplateQuery.data && !localTitle) {
            const fetchedTitle = existingTemplateQuery.data.title;
            setTitle(fetchedTitle);
            setLocalTitle(fetchedTitle);
        }
    }, [existingTemplateQuery.data, localTitle]);

    // Event handlers
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!localTitle.trim()) {
            toast.error("Template title is required");
            return;
        }

        if (isEditing) {
            templateMutation.mutate({ id: template_id, title: localTitle });
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
            // Navigate to search with existing template_id
            navigate(`/workouts/templates/${template_id}/search`);
        }
    };

    const handleCancel = async () => {
        try {
            // Check if we need to delete empty template
            const exercises = queryClient.getQueryData(["template_exercises", template_id]);
            if (isEditing && exercises && exercises.length === 0) {
                await new Promise((resolve) => setTimeout(resolve, 350));
                deleteTemplateMutation.mutate(template_id);
            }
        } catch (err) {
            console.log(err);
        } finally {
            navigate("/workouts", { replace: true });
        }
    };

    const handleDeleteTemplate = () => {
        if (window.confirm("Are you sure you want to delete this template?")) {
            deleteTemplateMutation.mutate(template_id);
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