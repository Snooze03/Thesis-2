import api from "@/api";
import { useQuery, QueryClient } from "@tanstack/react-query";

export function useFoodDatabase() {
    const fetchFood = useQuery({
        queryKey: ['foodDatabase'],
        queryFn: async ({ foodID }) => {
            const response = await api.get(`/nutrition/food-database/${foodID}/`);
            return response.data;
        },
        onSuccess: (data) => {
            console.log('Fetched food database:', data);
        }
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