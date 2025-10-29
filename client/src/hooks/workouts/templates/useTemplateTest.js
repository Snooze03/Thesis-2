import api from "@/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function useTemplateTest() {
    const queryClient = useQueryClient();

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

    return {
        createTemplate: (data, options = {}) => {
            return createTemplate.mutate(data, options);
        },
        isCreating: createTemplate.isPending
    };
}