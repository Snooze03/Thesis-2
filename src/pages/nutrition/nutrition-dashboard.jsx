import { MainLayout } from "@/layouts/main-layout";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionTitle, SectionSubTitle, SectionSubText } from "@/components/ui/section-title";
import { Ham, EggFried, Salad, Pizza, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const NutritionDashboard = () => {

    return (
        <MainLayout>
            <SectionTitle>Nutrition</SectionTitle>
            <SectionSubText>Log and track your macros</SectionSubText>

            {/* <SectionSubTitle>Add Food</SectionSubTitle> */}
            {/* <AddFood /> */}
        </MainLayout>
    );
}

const AddFood = () => {
    return (
        <Card>
            <CardContent>
                <div className="grid grid-cols-1 grid-rows-4 gap-2">

                    <div className="px-3 py-2 grid grid-cols-[min-content_auto] gap-3 bg-gray-50 rounded-lg hover:shadow-lg transition-shadow delay-50 duration-200 ease-in-out">
                        <EggFried className="size-7 stroke-yellow-300 self-center justify-self-center" />
                        <div>
                            <p>Breakfast</p>
                            <p className="text-gray-500">422 calories | 3 items</p>
                        </div>
                    </div>


                    <div className="px-3 py-2 grid grid-cols-[min-content_auto] gap-3 bg-gray-50 rounded-lg hover:shadow-lg transition-shadow delay-50 duration-200 ease-in-out">
                        <Salad className="size-7 stroke-green-300 self-center justify-self-center" />
                        <div>
                            <p>Lunch</p>
                            <p className="text-gray-500">751 calories | 2 items</p>
                        </div>
                    </div>

                    <div className="px-3 py-2 grid grid-cols-[min-content_auto] gap-3 bg-gray-50 rounded-lg hover:shadow-lg transition-shadow delay-50 duration-200 ease-in-out">
                        <Ham className="size-7 stroke-red-400 self-center justify-self-center" />
                        <div>
                            <p>Dinner</p>
                            <p className="text-gray-500">870 calories | 3 items</p>
                        </div>
                    </div>

                    <div className="px-3 py-2 grid grid-cols-[min-content_auto] gap-3 bg-gray-50 rounded-lg hover:shadow-lg transition-shadow delay-50 duration-200 ease-in-out">
                        <Pizza className="size-7 stroke-orange-300 self-center justify-self-center" />
                        <div>
                            <p>Snacks</p>
                            <p className="text-gray-500">560 calories | 2 items</p>
                        </div>
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
    );
}

export { NutritionDashboard }