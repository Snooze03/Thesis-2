import { MainLayout } from "@/layouts/main-layout";
import { SectionTitle, SectionSubTitle, SectionSubText } from "@/components/ui/section-title";
import { useDailyEntry } from "@/hooks/nutrition/useDailyEntry";
import { Macros } from "./macros";
import { AddFood } from "./daily-entry";

const NutritionDashboard = () => {
    const {
        data: dailyEntry,
        isLoading: isDailyEntryLoading,
    } = useDailyEntry();

    console.log(dailyEntry);

    // console.log("Nutrition Profile:", profile);

    if (isDailyEntryLoading) {
        return <MainLayout>Loading...</MainLayout>;
    }

    return (
        <MainLayout>
            <SectionTitle>Nutrition</SectionTitle>
            <SectionSubText>Log and track your macros</SectionSubText>
            <Macros dailyEntry={dailyEntry} />

            <SectionSubTitle>Add Food</SectionSubTitle>
            <AddFood />
        </MainLayout>
    );
}


export { NutritionDashboard }