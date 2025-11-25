import api from "@/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useMemo } from "react";

export function useWeightHistory() {
    const entries = useQuery({
        queryKey: ["weightEntries"],
        queryFn: async () => {
            const response = await api.get("/accounts/weight-history/");
            return response.data.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes 
    });

    // Memoize the sorting and grouping to prevent recalculation on every render
    const sortedAndGroupedEntries = useMemo(() => {
        if (!entries.data) return {};

        return entries.data
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
            }, {});
    }, [entries.data]);

    return {
        weightEntries: sortedAndGroupedEntries,
        isLoading: entries.isLoading,
        isError: entries.isError,
        error: entries.error
    }
}

export function useRecentWeightHistory() {
    const query = useQuery({
        queryKey: ["weight_history"],
        queryFn: async () => {
            const response = await api.get("accounts/weight-history/recent/");
            return response.data.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
    });

    // Memoize chart data transformation
    const chartData = useMemo(() => {
        if (!query.data) return [];

        return [...query.data]
            .sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date))
            .slice(-10)
            .map((entry) => ({
                month: new Date(entry.recorded_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                }),
                weight: parseFloat(entry.weight),
            }));
    }, [query.data]);

    return {
        weightHistory: query.data || [],
        chartData,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch
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
            // Invalidate queries to refetch fresh data
            queryClient.invalidateQueries({ queryKey: ["account_data"] });
            queryClient.invalidateQueries({ queryKey: ["weightEntries"] });
            queryClient.invalidateQueries({ queryKey: ["weight_history"] });
        },
        onError: (error) => {
            console.error('Add weight error:', error);
        }
    });

    return {
        mutate: addEntry.mutate,
        mutateAsync: addEntry.mutateAsync,
        isPending: addEntry.isPending,
        isError: addEntry.isError,
        isSuccess: addEntry.isSuccess,
        error: addEntry.error,
        reset: addEntry.reset
    }
}

export function useDeleteWeightEntry() {
    const queryClient = useQueryClient();

    const deleteEntry = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/accounts/weight-history/${id}/`);
        },
        // Optimistic update for better UX
        onMutate: async (deletedId) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["weightEntries"] });
            await queryClient.cancelQueries({ queryKey: ["weight_history"] });

            // Snapshot previous values
            const previousEntries = queryClient.getQueryData(["weightEntries"]);
            const previousHistory = queryClient.getQueryData(["weight_history"]);

            // Optimistically update cache
            queryClient.setQueryData(["weightEntries"], (old) => {
                if (!old) return old;
                return old.filter(entry => entry.id !== deletedId);
            });

            queryClient.setQueryData(["weight_history"], (old) => {
                if (!old) return old;
                return old.filter(entry => entry.id !== deletedId);
            });

            // Return context with snapshot
            return { previousEntries, previousHistory };
        },
        onSuccess: () => {
            toast.success("Entry deleted successfully!");
        },
        onError: (error, deletedId, context) => {
            // Rollback on error
            if (context?.previousEntries) {
                queryClient.setQueryData(["weightEntries"], context.previousEntries);
            }
            if (context?.previousHistory) {
                queryClient.setQueryData(["weight_history"], context.previousHistory);
            }
            toast.error("Failed to delete weight entry");
            console.error('Delete error:', error);
        },
        onSettled: () => {
            // Always refetch after error or success
            queryClient.invalidateQueries({ queryKey: ["weightEntries"] });
            queryClient.invalidateQueries({ queryKey: ["weight_history"] });
        }
    });

    return {
        mutate: deleteEntry.mutate,
        mutateAsync: deleteEntry.mutateAsync,
        isPending: deleteEntry.isPending,
        isError: deleteEntry.isError,
        isSuccess: deleteEntry.isSuccess,
        error: deleteEntry.error,
        reset: deleteEntry.reset
    }
}