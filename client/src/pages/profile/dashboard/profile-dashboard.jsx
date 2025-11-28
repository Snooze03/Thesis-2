import { useScrollLock } from "@/hooks/useScrollLock";
import { useAccountProfile } from "@/hooks/profile/useAccountProfile";
import { fetchProgressReport } from "@/hooks/assistant/useProgressReport";
import { MainLayout } from "@/layouts/main-layout";
import { ProfileCard } from "./profile-card";
import { WeightManager } from "./weight-chart";
import { BeforeAndAfterPicture } from "./before-and-after-picture";
import { ReportCard } from "./progress-reports";
import { SectionTitle, SectionSubTitle } from "@/components/ui/section-title";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyItems } from "@/components/empty-items";

const Profile = () => {
    const {
        accountData,
        accountProfile,
        isPending,
    } = useAccountProfile();

    const {
        progressReports,
        isLoading,
        isError
    } = fetchProgressReport();

    useScrollLock(isPending || isLoading);

    if (isPending || isLoading) {
        return (
            <MainLayout>
                <Skeleton className="h-10 w-25 rounded-lg" />
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-10 w-30 rounded-lg" />
                <Skeleton className="h-56 w-full rounded-lg" />
            </MainLayout>
        )
    }

    return (
        <MainLayout>
            <SectionTitle>Profile</SectionTitle>
            <ProfileCard data={accountData} profile={accountProfile} />

            <SectionSubTitle>Weight Logs</SectionSubTitle>
            <WeightManager />

            <SectionSubTitle>Progress Photo</SectionSubTitle>
            <BeforeAndAfterPicture />

            <SectionSubTitle>Generated Reports</SectionSubTitle>
            {!progressReports || progressReports.length === 0 ? (
                <EmptyItems title="No progress reports yet." description="make sure to properly configure the settings" />
            ) : (
                progressReports.map((report, index) => (
                    <ReportCard
                        key={index}
                        data={report}
                    />
                ))
            )};
        </MainLayout >
    );
}

export { Profile }