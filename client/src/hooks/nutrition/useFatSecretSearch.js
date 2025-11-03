import { useQuery } from "@tanstack/react-query";
import api from "@/api";

export function useFatSecretSearch() {
    const searchFoods = async ({ queryKey }) => {
        const [_, searchTerm, page = 0] = queryKey;
        if (!searchTerm || searchTerm.length < 3) {
            return { foods: [] };
        }

        try {
            const response = await api.get('nutrition/foods/search/', {
                params: { q: searchTerm, page }
            });
            // Error checking
            console.log('Food search response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Food search error:', error);
            throw error;
        }
    };

    const useFoodSearch = (searchTerm, page = 0) => {
        return useQuery({
            queryKey: ["foodSearch", searchTerm, page],
            queryFn: searchFoods,
            enabled: !!searchTerm && searchTerm.length > 2,
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 2,
        });
    };

    const useFoodDetails = (foodId) => {
        return useQuery({
            queryKey: ["foodDetails", foodId],
            queryFn: async () => {
                const response = await api.get(`nutrition/foods/${foodId}/`);
                return response.data;
            },
            enabled: !!foodId,
            staleTime: 10 * 60 * 1000, // 10 minutes
        });
    };

    return { useFoodSearch, useFoodDetails };
}