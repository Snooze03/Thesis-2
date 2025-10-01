import { useQuery } from "@tanstack/react-query";
import api from "@/api";

/**
 * Custom hook to fetch the current authenticated user's nutrition profile
 * @returns {Object} Hook return object with nutrition profile data and states
 */
export function useNutritionProfile() {
    // Get nutrition profile
    const getNutritionProfile = async () => {
        const response = await api.get("/nutrition/profiles/");

        // Backend returns array, get the first profile (current user's profile)
        if (response.data && response.data.length > 0) {
            return response.data[0];
        }

        return null;
    };

    const profileQuery = useQuery({
        queryKey: ["nutrition", "profile"],
        queryFn: getNutritionProfile,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
        refetchOnWindowFocus: false,
    });

    return {
        // Query data
        profile: profileQuery.data || null,

        // Loading state
        isLoading: profileQuery.isPending,

        // Error states
        isError: profileQuery.isError,
        error: profileQuery.error,

        // Actions
        refetch: profileQuery.refetch,
    };
}
