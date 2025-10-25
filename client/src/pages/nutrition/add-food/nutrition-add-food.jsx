import { useNavigate } from "react-router-dom";
import { SubLayout } from "@/layouts/sub-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search } from "lucide-react";
import { AddSearch } from "./add-search";
import { DietPlan } from "./diet-plan";

const AddFood = () => {
    const navigate = useNavigate();

    return (
        <SubLayout>
            <div className="flex gap-2 items-center">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft className="size-5" />
                </Button>
                <h1 className="font-bold">Add Food</h1>
            </div>

            <Tabs defaultValue="search_food">
                <TabsList className="w-full bg-primary-400 mb-3">
                    <TabsTrigger value="diet_plan">Diet Plan</TabsTrigger>
                    <TabsTrigger value="search_food">Search Food</TabsTrigger>
                    <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
                </TabsList>
                <TabsContent value="diet_plan">
                    <DietPlan />
                </TabsContent>
                <TabsContent value="search_food">
                    <AddSearch />
                </TabsContent>
                <TabsContent value="alternatives">
                    {/* <Article categoryDirectory="/articles/recovery" /> */}
                </TabsContent>
            </Tabs>
        </SubLayout>
    );
}

export { AddFood }