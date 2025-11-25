import api from "@/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function useWeightHistory() {
    const entries = useQuery({
        queryKey: ["weightEntries"],
        queryFn: async () => {
            const response = await api.get("/accounts/weight-history/");
            return response.data.data;
        }
    });

    // Sort entries by date (latest first) and group by month
    const sortedAndGroupedEntries = entries.data
        ? entries.data
            .sort((a, b) => new Date(b.recorded_date) - new Date(a.recorded_date))
            .reduce((groups, entry) => {
                const date = new Date(entry.recorded_date);
                const monthYear = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                });

                if (!groups[monthYear]) {
                    groups[monthYear] = [];
                }
                groups[monthYear].push(entry);

                return groups;
            }, {})
        : {};

    return {
        weightEntries: sortedAndGroupedEntries,
        isLoading: entries.isLoading,
        isError: entries.isError
    }
}

export function useAddWeightEntry() {
    const queryClient = useQueryClient();

    const addEntry = useMutation({
        mutationFn: async (data) => {
            const payload = {
                weight: parseFloat(data.weight).toFixed(2),
                recorded_date: data.recorded_date
            };
            return await api.post("accounts/weight-history/", payload);
        },
        onSuccess: () => {
            toast.success("Weight entry added successfully!");
            // Invalidate both query keys to refresh all weight data
            queryClient.invalidateQueries({ queryKey: ["weightEntries"] });
            queryClient.invalidateQueries({ queryKey: ["weight_history"] });
        },
        onError: (error) => {
            console.error('Add weight error:', error);
        }
    });

    return {
        addMutation: addEntry,
        isPending: addEntry.isPending,
        isError: addEntry.isError,
        error: addEntry.error
    }
}

export function useDeleteWeightEntry() {
    const queryClient = useQueryClient();

    const deleteEntry = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/accounts/weight-history/${id}/`);
        },
        onSuccess: () => {
            toast.success("Entry deleted successfully!");
            // Invalidate both query keys to refresh all weight data
            queryClient.invalidateQueries({ queryKey: ["weightEntries"] });
            queryClient.invalidateQueries({ queryKey: ["weight_history"] });
        },
        onError: (error) => {
            toast.error("Failed to delete weight entry");
            console.error('Delete error:', error);
        }
    });

    return {
        deleteMutation: deleteEntry,
        isPending: deleteEntry.isPending,
        isError: deleteEntry.isError
    }
}