import { MainLayout } from "@/layouts/main-layout";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionTitle, SectionSubTitle, SectionSubText } from "@/components/ui/section-title";
import { RadialProgress } from "@/components/ui/radial-progress";
import { Flag, CookingPot, Ham, EggFried, Salad, Pizza, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const NutritionDashboard = () => {

    return (
        <MainLayout>
            <SectionTitle>Nutrition</SectionTitle>
            <SectionSubText>Track your food intake and etc etc</SectionSubText>

            <Card className="py-5">
                <CardContent className="flex items-center justify-center gap-5">
                    <RadialProgress size="lg" value="500" max="2000" label="remaining" />
                    <div className="grid grid-row-2 gap-1">
                        <div className="flex flex-col gap-1">
                            <div className="grid grid-cols-[auto_1fr] grid-rows-2 space-x-2 place-items-center">
                                <Flag className="size-3" />
                                <span className="justify-self-start text-sm">2000</span>
                                <p className="col-span-2 text-xs justify-self-start text-gray-800">Total Calories</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="grid grid-cols-[auto_1fr] grid-rows-2 space-x-2 place-items-center">
                                <CookingPot className="size-3" />
                                <span className="justify-self-start text-sm">500</span>
                                <p className="col-span-2 text-xs justify-self-start text-gray-800">Calories Consumed</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <SectionSubTitle>Macros</SectionSubTitle>
            <Card className="py-4">
                <CardContent>
                    <div className="grid grid-cols-3 gap-5">
                        <div className="grid grid-rows-[auto_1fr] gap-1 place-items-center">
                            <p className="text-sm">Carbs</p>
                            <RadialProgress value="90" max="130" label="remaining" />
                        </div>
                        <div className="grid grid-rows-[auto_1fr] gap-1 place-items-center">
                            <p className="text-sm">Protein</p>
                            <RadialProgress value="68" max="100" label="remaining" />
                        </div>
                        <div className="grid grid-rows-[auto_1fr] gap-1 place-items-center">
                            <p className="text-sm">Fats</p>
                            <RadialProgress value="60" max="85" label="remaining" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <SectionSubTitle>Add Food</SectionSubTitle>
            <Card>
                <CardContent>
                    <div className="grid grid-cols-2 grid-rows-2 gap-2">
                        <div className="grid grid-rows-2">
                            <p>
                                <EggFried className="inline mr-3 stroke-yellow-400" />
                                Breakfast
                            </p>
                            <p className="ml-8 text-gray-500">422 calories</p>
                        </div>
                        <div className="grid grid-rows-2">
                            <p>
                                <Ham className="inline mr-3 stroke-red-400" />
                                Lunch
                            </p>
                            <p className="ml-8 text-gray-500">839 calories</p>
                        </div>
                        <div className="grid grid-rows-2">
                            <p>
                                <Salad className="inline mr-3 stroke-green-400" />
                                Dinner
                            </p>
                            <p className="ml-8 text-gray-500">753 calories</p>
                        </div>
                        <div className="grid grid-rows-2">
                            <p>
                                <Pizza className="inline mr-3 stroke-orange-400" />
                                Snacks
                            </p>
                            <p className="ml-8 text-gray-500">332 calories</p>
                        </div>
                    </div>

                    <CardAction className="w-full mt-5">
                        <Button className="w-full">
                            <Search className="inline" />
                            Add Food
                        </Button>
                    </CardAction>
                </CardContent>
            </Card>
        </MainLayout>
    );
}

export { NutritionDashboard }