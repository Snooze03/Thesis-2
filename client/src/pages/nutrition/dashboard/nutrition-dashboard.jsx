import { MainLayout } from "@/layouts/main-layout";
import { SectionTitle, SectionSubTitle, SectionSubText } from "@/components/ui/section-title";
import { useDailyEntry } from "@/hooks/nutrition/useDailyEntry";
import { Macros } from "./macros";
import { Skeleton } from "@/components/ui/skeleton";
import { useScrollLock } from "@/hooks/useScrollLock";
import { DailyEntriesHistory } from "./daily-entries-history";

const NutritionDashboard = () => {
    const {
        data: dailyEntry,
        isLoading: isDailyEntryLoading,
    } = useDailyEntry();

    // console.log(dailyEntry);
    // console.log("Nutrition Profile:", profile);

    if (isDailyEntryLoading) {
        return <NutritionDashboardSkeleton />;
    }


    return (
        <MainLayout>
            <SectionTitle>Nutrition</SectionTitle>
            <SectionSubText>Log and track your macros</SectionSubText>
            <Macros dailyEntry={dailyEntry} />

            <SectionSubTitle>Food Entries</SectionSubTitle>
            <DailyEntriesHistory />
        </MainLayout>
    );
}

const NutritionDashboardSkeleton = () => {
    useScrollLock(true);

    return (
        <MainLayout>
            {[...Array(3)].map((_, index) => (
                <div key={index} className="space-y-3">
                    <Skeleton className="w-30 h-5" />
                    <Skeleton className="w-full h-55" />
                </div>
            ))}
        </MainLayout>
    );
}


export { NutritionDashboard }