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

export function useDeleteWeightEntry() {
    const queryClient = useQueryClient();

    const deleteEntry = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/accounts/weight-history/${id}/`);
        },
        onSuccess: () => {
            // Invalidate and refetch the weight entries
            toast.success("Entry deleted successfully!");
            queryClient.invalidateQueries({ queryKey: ["weightEntries"] });
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