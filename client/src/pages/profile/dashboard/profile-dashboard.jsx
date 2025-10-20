"use client"

import { useScrollLock } from "@/hooks/useScrollLock";
import { useAccountProfile } from "@/hooks/profile/useAccountProfile";
import { MainLayout } from "@/layouts/main-layout";
import { ProfileCard } from "./profile-card";
import { WeightManager } from "./weight-chart";
import { BeforeAndAfterPicture } from "./before-and-after-picture";
import { ReportCard } from "./progress-reports";
import { SectionTitle, SectionSubTitle } from "@/components/ui/section-title";
import { Skeleton } from "@/components/ui/skeleton";

const Profile = () => {
    const {
        account_data,
        account_profile,
        isPending,
    } = useAccountProfile();

    // console.log(account_profile);

    useScrollLock(isPending);

    if (isPending) {
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
            <ProfileCard acc_data={account_data} acc_profile={account_profile} />

            <SectionSubTitle>Weight Logs</SectionSubTitle>
            <WeightManager />

            <SectionSubTitle>Progress Photo</SectionSubTitle>
            <BeforeAndAfterPicture />

            <SectionSubTitle>Generated Reports</SectionSubTitle>
            {/* <EmptyItems title="No progress reports yet." description="make sure to properly configure the settings" /> */}
            {/* To Loop on using back-end later */}
            <ReportCard number="1" date="March 12, 2025" description="Great progress on your strength goals! Your bench press has improved by 10% and you've been consistent with your workouts." />
        </MainLayout >
    );
}

export { Profile }