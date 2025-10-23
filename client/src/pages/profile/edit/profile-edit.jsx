import { useNavigate, useLocation } from "react-router-dom";
import api from "@/api";
import { useQuery } from "@tanstack/react-query";
import { SubLayout } from "@/layouts/sub-layout";
import { SectionTitle } from "@/components/ui/section-title";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { UpdateBasicInfo } from "./basic-information";
import { UpdateAdditionalInfo } from "./additional-information";

export function ProfileEdit() {
    const navigate = useNavigate();
    const location = useLocation();

    // Get data from navigation state if available
    const passedUserData = location.state?.userData;

    const {
        data: user_data = [],
        isPending,
    } = useQuery({
        queryKey: ["account_data_fallback"],
        queryFn: async () => {
            const response = await api.get("accounts/profiles/");
            return response.data;
        },
        enabled: !passedUserData, // Only run this query if no data was passed
    });

    // used passed data if available, otherwise fallback to fetched data
    const userData = passedUserData || user_data;

    if (!passedUserData && isPending) return <LoadingSpinner />;

    return (
        <SubLayout>
            <div className="flex gap-2 items-center">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft className="size-5" />
                </Button>
                <SectionTitle>Edit</SectionTitle>
            </div>

            <UpdateBasicInfo userData={userData} />

            <UpdateAdditionalInfo userData={userData} />

        </SubLayout>
    );
}
