import { MainLayout } from "@/layouts/main-layout";
import { SectionTitle, SectionSubTitle, SectionSubText } from "@/components/ui/section-title";
import { useDailyEntry } from "@/hooks/nutrition/useDailyEntry";
import { Macros } from "./macros";
import { FoodEntry } from "./daily-entry";
import { Skeleton } from "@/components/ui/skeleton";
import { useScrollLock } from "@/hooks/useScrollLock";

const NutritionDashboard = () => {
    const {
        data: dailyEntry,
        isLoading: isDailyEntryLoading,
    } = useDailyEntry();

    console.log(dailyEntry);

    // console.log("Nutrition Profile:", profile);

    useScrollLock(isDailyEntryLoading);

    if (isDailyEntryLoading) {
        return <NutritionDashboardSkeleton />;
    }

    return (
        <MainLayout>
            <SectionTitle>Nutrition</SectionTitle>
            <SectionSubText>Log and track your macros</SectionSubText>
            <Macros dailyEntry={dailyEntry} />

            <SectionSubTitle>Food Entries</SectionSubTitle>
            <FoodEntry dailyEntry={dailyEntry} />
        </MainLayout>
    );
}

const NutritionDashboardSkeleton = () => {
    return (
        <MainLayout>
            <Skeleton className="w-25 h-10" />
            <Skeleton className="w-30 h-5" />
            <Skeleton className="w-full h-55" />
            <Skeleton className="w-30 h-5" />
            <Skeleton className="w-full h-55" />
        </MainLayout>
    );
}


export { NutritionDashboard }