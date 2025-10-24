import api from "@/api";
import { useQuery, QueryClient } from "@tanstack/react-query";

export function useFoodDatabase(foodDatabaseId) {
    const fetchFood = useQuery({
        queryKey: ['foodDatabase'],
        queryFn: async () => {
            const response = await api.get(`/nutrition/foods-db/${foodDatabaseId}/`);
            return response.data;
        },
        onSuccess: (data) => {
            console.log('Fetched food database:', data);
        },
        enabled: !!foodDatabaseId, // Only run the query if foodDatabaseId is provided
        retry: 5
    })

    return {
        // Data
        foodData: fetchFood.data,

        // States
        isLoading: fetchFood.isLoading,
        isError: fetchFood.isError,
        error: fetchFood.error
    }
}