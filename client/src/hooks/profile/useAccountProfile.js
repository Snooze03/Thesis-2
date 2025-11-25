import api from "@/api";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useAccountProfile() {
    const query = useQuery({
        queryKey: ["account_data"],
        queryFn: async () => {
            const response = await api.get("accounts/profile/");
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes 
        gcTime: 1000 * 60 * 30, // 30 minutes 
        retry: 2, // Retry failed requests twice
        refetchOnWindowFocus: false,
    });

    // Memoize extracted data to prevent unnecessary re-renders
    const accountData = useMemo(() => {
        return query.data?.data || null;
    }, [query.data]);

    const accountProfile = useMemo(() => {
        return query.data?.data?.profile || null;
    }, [query.data]);

    return {
        // Data
        accountData,
        accountProfile,

        // States
        isLoading: query.isLoading,
        isPending: query.isPending,
        isError: query.isError,
        isSuccess: query.isSuccess,
        error: query.error,

        // Methods
        refetch: query.refetch,
    }
}