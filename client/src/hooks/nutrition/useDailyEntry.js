import api from "@/api";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useDailyEntry() {
    const query = useQuery({
        queryKey: ["todayDailyEntry"],
        queryFn: async () => {
            const response = await api.get("nutrition/daily-entries/today/");
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes 
        gcTime: 1000 * 60 * 10, // 10 minutes 
        refetchOnWindowFocus: false,
        retry: 2,
    });

    return {
        data: query.data?.data,
        isLoading: query.isLoading,
        isError: query.isError,
        isSuccess: query.isSuccess,
        error: query.error,
        refetch: query.refetch,
    };
}

export function useDailyEntriesHistory(page = 1, pageSize = 1, filters = {}) {
    // Memoize query key to prevent unnecessary refetches
    const queryKey = useMemo(
        () => ["dailyEntriesHistory", page, pageSize, filters],
        [page, pageSize, filters]
    );

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                page_size: pageSize.toString(),
            });

            // Add optional filters
            if (filters.date_from) {
                params.append('date_from', filters.date_from);
            }
            if (filters.date_to) {
                params.append('date_to', filters.date_to);
            }

            const response = await api.get(`nutrition/daily-entries/history/?${params}`);
            return response.data;
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
        gcTime: 1000 * 60 * 5, // 5 minutes 
        placeholderData: (previousData) => previousData, // Keep previous data while loading 
        retry: 2,
        enabled: pageSize > 0, // Only fetch if pageSize is valid
    });

    // Memoize pagination data to prevent recalculation
    const pagination = useMemo(() => ({
        count: query.data?.count || 0,
        next: query.data?.next,
        previous: query.data?.previous,
        totalPages: query.data?.count
            ? Math.ceil(query.data.count / pageSize)
            : 0,
        currentPage: page,
        pageSize,
    }), [query.data, page, pageSize]);

    return {
        data: query.data,
        entries: query.data?.results || [],
        pagination,
        isLoading: query.isLoading,
        isError: query.isError,
        isSuccess: query.isSuccess,
        error: query.error,
        isFetching: query.isFetching,
        refetch: query.refetch,
    };
}