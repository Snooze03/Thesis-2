import api from "@/api";
import { useQuery } from "@tanstack/react-query";

export function useAccountProfile() {
    const getProfile = useQuery({
        queryKey: ["account_data"],
        queryFn: async () => {
            const response = await api.get("accounts/profile/");
            return response.data;
        },
    });

    return {
        // Query
        getProfile,

        // Data
        account_data: getProfile.data ? getProfile.data.data : null,
        account_profile: getProfile.data ? getProfile.data.data.profile : null,

        // States
        isPending: getProfile.isPending,

    }
}
