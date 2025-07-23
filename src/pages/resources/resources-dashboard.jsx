import { MainLayout } from "@/layouts/main-layout";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionTitle, SectionSubTitle, SectionSubText } from "@/components/ui/section-title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Article from "@/components/article";

const ResourcesDashboard = () => {
    return (
        <MainLayout>
            <SectionTitle>Resources</SectionTitle>
            <SectionSubText>Access science based fitness resources</SectionSubText>

            <Tabs defaultValue="fitness">
                <TabsList className="w-full bg-primary-400 mb-3">
                    <TabsTrigger value="fitness">Fitness</TabsTrigger>
                    <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                    <TabsTrigger value="recovery">Recovery</TabsTrigger>
                </TabsList>
                <TabsContent value="fitness">
                    <FitnessTab></FitnessTab>
                </TabsContent>
                <TabsContent value="nutrition">
                    <NutritionTab></NutritionTab>
                </TabsContent>
                <TabsContent value="recovery">
                    <RecoveryTab></RecoveryTab>
                </TabsContent>
            </Tabs>

        </MainLayout>
    );
}

const FitnessTab = () => {
    return (
        <Article articlesJsonPath="/articles/sample.json" />
    );
}

const NutritionTab = () => {
    return <h1>Nutrition Tab</h1>
}

const RecoveryTab = () => {
    return <h1>Recovery Tab</h1>
}
export { ResourcesDashboard }