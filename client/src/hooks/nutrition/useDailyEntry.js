import api from "@/api";
import { useQuery } from "@tanstack/react-query";

export function useDailyEntry() {
    const fetchTodayDailyEntry = useQuery({
        queryKey: ["todayDailyEntry"],
        queryFn: async () => {
            const response = await api.get("nutrition/daily-entries/today/");
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
    });

    return {
        fetchTodayDailyEntry,
        data: fetchTodayDailyEntry.data?.data,
        isLoading: fetchTodayDailyEntry.isLoading,
        error: fetchTodayDailyEntry.error,
    };
}

// Paginated daily entries
export function useDailyEntriesHistory(page = 1, pageSize = 1, filters = {}) {
    const fetchDailyEntriesHistory = useQuery({
        queryKey: ["dailyEntriesHistory", page, pageSize, filters],
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
        staleTime: 2 * 60 * 1000, // 2 minutes
        cacheTime: 5 * 60 * 1000, // 5 minutes
        keepPreviousData: true, // Keep previous data while loading new page
        retry: 2, // Retry failed requests
    });

    return {
        fetchDailyEntriesHistory,
        data: fetchDailyEntriesHistory.data,
        entries: fetchDailyEntriesHistory.data?.results || [],
        pagination: {
            count: fetchDailyEntriesHistory.data?.count || 0,
            next: fetchDailyEntriesHistory.data?.next,
            previous: fetchDailyEntriesHistory.data?.previous,
            totalPages: fetchDailyEntriesHistory.data?.count ?
                Math.ceil(fetchDailyEntriesHistory.data.count / pageSize) : 0,
        },
        isLoading: fetchDailyEntriesHistory.isLoading,
        error: fetchDailyEntriesHistory.error,
        isFetching: fetchDailyEntriesHistory.isFetching,
    };
}