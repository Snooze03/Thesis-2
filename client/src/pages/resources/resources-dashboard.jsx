import { MainLayout } from "@/layouts/main-layout";
import { SectionTitle, SectionSubText } from "@/components/ui/section-title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Article } from "./article";

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
                    <Article categoryDirectory="/articles/fitness" />
                </TabsContent>
                <TabsContent value="nutrition">
                    <Article categoryDirectory="/articles/nutrition" />
                </TabsContent>
                <TabsContent value="recovery">
                    <Article categoryDirectory="/articles/recovery" />
                </TabsContent>
            </Tabs>
        </MainLayout>
    );
}

export { ResourcesDashboard }