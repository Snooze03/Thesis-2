import api from "@/api";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useFoodDatabase(foodDatabaseId) {
    const query = useQuery({
        queryKey: ['foodDatabase', foodDatabaseId],
        queryFn: async () => {
            const response = await api.get(`/nutrition/foods-db/${foodDatabaseId}/`);
            return response.data;
        },
        enabled: !!foodDatabaseId, // Only run the query if foodDatabaseId is provided
        retry: 2,
        staleTime: 1000 * 60 * 10, // 10 minutes 
        gcTime: 1000 * 60 * 30, // 30 minutes 
        refetchOnWindowFocus: false,
    });

    // Memoize extracted data to prevent unnecessary re-renders
    const foodDetails = useMemo(() => query.data || null, [query.data]);

    const foodServings = useMemo(() => {
        const servings = query.data?.fatsecret_servings;
        return Array.isArray(servings) ? servings : [];
    }, [query.data]);

    return {
        // Data
        foodData: query.data,
        foodDetails,
        foodServings,

        // States
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isError: query.isError,
        isSuccess: query.isSuccess,
        error: query.error,

        // Methods
        refetch: query.refetch,
    }
}