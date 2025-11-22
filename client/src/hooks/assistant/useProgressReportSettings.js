import api from "@/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function fetchSettings() {
    const settings = useQuery({
        queryKey: ['progressReportSettings'],
        queryFn: async () => {
            const response = await api.get(`/assistant/progress-report-settings/`);
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
        refetchOnWindowFocus: false,
    });

    return {
        settings: settings.data,
        isLoading: settings.isLoading,
        isError: settings.isError,
    }
}

export function useUpdateSettings() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (updateData) => {
            const id = updateData.id;
            const response = await api.patch(`/assistant/progress-report-settings/${id}/`, updateData);
            return response.data;
        },
        onSuccess: (data) => {
            // Invalidate and refetch settings
            queryClient.invalidateQueries({ queryKey: ['progressReportSettings'] });
            toast.success("Settings updated successfully!");
            // console.log("Settings updated successfully", { ...data });
        },
        onError: (error) => {
            console.error("Error updating settings:", error);
            toast.error("Failed to update settings. Please try again.");
        },
    });

    return {
        updateSettings: mutation.mutate,
        isLoading: mutation.isPending,
        isError: mutation.isError,
    };
}