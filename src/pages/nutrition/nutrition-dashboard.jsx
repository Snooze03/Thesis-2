import { MainLayout } from "@/layouts/main-layout";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { SectionTitle, SectionSubTitle, SectionSubText } from "@/components/ui/section-title";
import { RadialProgress } from "@/components/ui/radial-progress";
import { Progress } from "@/components/ui/progress";
import { Coffee, Utensils, Moon, Cookie, Search, Zap, Wheat, Beef, Citrus, TrendingUp, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

const NutritionDashboard = () => {

    return (
        <MainLayout>
            <SectionTitle>Nutrition</SectionTitle>
            <SectionSubText>Log and track your macros</SectionSubText>
            <Macros />

            <SectionSubTitle>Add Food</SectionSubTitle>
            <AddFood />
        </MainLayout>
    );
}

const Macros = () => {
    return (
        <div className="flex justify-center w-full">
            <Carousel className="w-full sm:w-74">
                <CarouselContent>
                    <CarouselItem className="my-auto">
                        <Card className="place-items-center py-4 ">
                            <CardTitle className="-mb-3">
                                <Zap className="inline mr-1.5 size-4" />
                                Calories
                            </CardTitle>
                            <RadialProgress value="1503" max="2000" size="xl" label="remaining" className="-mb-3" />
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="grid grid-rows-3 gap-[4px] place-items-start bg-orange-100 px-5 py-2 rounded-lg">
                                    <p>
                                        <TrendingUp className="inline size-4 mr-2" />
                                        Consumed
                                    </p>
                                    <p className="font-semibold">500 <span className="text-muted-foreground font-normal">kcal</span></p>
                                    <Progress value={50} className="bg-gray-100 [&>*]:bg-orange-300 mt-1" />
                                </div>
                                <div className="grid grid-rows-3 gap-[4px] place-items-start bg-green-100 px-5 py-2 rounded-lg">
                                    <p>
                                        <Target className="inline size-4 mr-2" />
                                        Goal
                                    </p>
                                    <p className="font-semibold">2000 <span className="text-muted-foreground font-normal">kcal</span></p>
                                    <Progress value={100} className="bg-gray-100 [&>*]:bg-green-300 mt-1" />
                                </div>
                            </div>
                        </Card>
                    </CarouselItem>
                    <CarouselItem>
                        <Card className="place-items-center py-4 gap-2">
                            <CardTitle>Macronutrients</CardTitle>
                            <div className="w-full px-6 grid grid-cols-[auto_1fr_1fr_1fr] grid-rows-3 items-center">
                                <div className="mr-2 row-span-2 bg-orange-300 rounded-full">
                                    <Wheat className="size-4 m-2 stroke-white" />
                                </div>
                                <p className="col-start-2">Carbs</p>
                                <p className="col-start-2 row-start-2 text-muted-foreground text-sm">120/160 g</p>
                                <p className="col-start-4 justify-self-end font-semibold">40 g</p>
                                <p className="col-start-4 justify-self-end text-muted-foreground text-sm">remaining</p>
                                <Progress value={40} className="col-span-4 bg-gray-100 [&>*]:bg-orange-300" />
                            </div>
                            <div className="w-full px-6 grid grid-cols-[auto_1fr_1fr_1fr] grid-rows-3 items-center">
                                <div className="mr-2 row-span-2 bg-green-300 rounded-full">
                                    <Beef className="size-4 m-2 stroke-white" />
                                </div>
                                <p className="col-start-2">Protein</p>
                                <p className="col-start-2 row-start-2 text-muted-foreground text-sm">88/100 g</p>
                                <p className="col-start-4 justify-self-end font-semibold">80 g</p>
                                <p className="col-start-4 justify-self-end text-muted-foreground text-sm">remaining</p>
                                <Progress value={80} className="col-span-4 bg-gray-100 [&>*]:bg-green-300" />
                            </div>
                            <div className="w-full px-6 grid grid-cols-[auto_1fr_1fr_1fr] grid-rows-3 items-center">
                                <div className="mr-2 row-span-2 bg-violet-300 rounded-full">
                                    <Citrus className="size-4 m-2 stroke-white" />
                                </div>
                                <p className="col-start-2">Fats</p>
                                <p className="col-start-2 row-start-2 text-muted-foreground text-sm">50/90 g</p>
                                <p className="col-start-4 justify-self-end font-semibold">20 g</p>
                                <p className="col-start-4 justify-self-end text-muted-foreground text-sm">remaining</p>
                                <Progress value={20} className="col-span-4 bg-gray-100 [&>*]:bg-violet-300" />
                            </div>
                        </Card>
                    </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="max-sm:hidden" />
                <CarouselNext className="max-sm:hidden" />
            </Carousel>
        </div>
    );
}

const AddFood = () => {
    return (
        <Card>
            <CardContent>
                <div className="grid grid-cols-1 grid-rows-4 gap-3 lg:grid-cols-2 lg:grid-rows-2">
                    <div className="grid grid-cols-[min-content_auto] gap-3">
                        <div className="bg-orange-100 rounded-full self-center">
                            <Coffee className="size-6 m-2 stroke-orange-300 self-center justify-self-center" />
                        </div>
                        <div>
                            <p>Breakfast</p>
                            <p className="text-gray-500">422 calories | 3 items</p>
                        </div>
                    </div>


                    <div className="grid grid-cols-[min-content_auto] gap-3">
                        <div className="bg-green-100 rounded-full self-center">
                            <Utensils className="size-6 m-2 stroke-green-300 self-center justify-self-center" />
                        </div>
                        <div>
                            <p>Lunch</p>
                            <p className="text-gray-500">751 calories | 2 items</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-[min-content_auto] gap-3">
                        <div className="bg-violet-100 rounded-full self-center">
                            <Moon className="size-6 m-2 stroke-violet-300 self-center justify-self-center" />
                        </div>
                        <div>
                            <p>Dinner</p>
                            <p className="text-gray-500">870 calories | 3 items</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-[min-content_auto] gap-3">
                        <div className="bg-sky-100 rounded-full self-center">
                            <Cookie className="size-6 m-2 stroke-sky-300 self-center justify-self-center" />
                        </div>
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