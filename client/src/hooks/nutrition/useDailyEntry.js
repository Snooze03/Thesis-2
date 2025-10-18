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
        data: fetchTodayDailyEntry.data?.data.id,
        isLoading: fetchTodayDailyEntry.isLoading,
        error: fetchTodayDailyEntry.error,
    };
}