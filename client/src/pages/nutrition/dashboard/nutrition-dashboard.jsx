import { MainLayout } from "@/layouts/main-layout";
import { useNavigate } from "react-router-dom";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { SectionTitle, SectionSubTitle, SectionSubText } from "@/components/ui/section-title";
import { RadialProgress } from "@/components/ui/radial-progress";
import { Progress } from "@/components/ui/progress";
import { Coffee, Utensils, Moon, Cookie, Search, Zap, Wheat, Beef, Citrus, TrendingUp, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNutritionProfile } from "@/hooks/nutrition/useNutritionProfile";


const NutritionDashboard = () => {
    const {
        profile,
        isLoading,
        isError,
        error,
        refetch
    } = useNutritionProfile();

    console.log("Nutrition Profile:", profile);

    return (
        <MainLayout>
            <SectionTitle>Nutrition</SectionTitle>
            <SectionSubText>Log and track your macros</SectionSubText>
            <Macros userNutritionProfile={profile} />

            <SectionSubTitle>Add Food</SectionSubTitle>
            <AddFood />
        </MainLayout>
    );
}


const Macros = ({ userNutritionProfile }) => {

    const daily_calories = userNutritionProfile ? userNutritionProfile.daily_calories_goal : 0;
    const daily_carbs = userNutritionProfile ? userNutritionProfile.daily_carbs_goal : 0;
    const daily_protein = userNutritionProfile ? userNutritionProfile.daily_protein_goal : 0;
    const daily_fats = userNutritionProfile ? userNutritionProfile.daily_fat_goal : 0;


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
                            <RadialProgress value="1000" max={daily_calories} size="xl" label="remaining" className="-mb-5" />
                            <div className="grid grid-cols-2 gap-3 text-sm p-4 -mb-2">
                                <div className="grid auto-rows-auto gap-[4px] place-items-start bg-orange-100 px-4 py-3 rounded-lg">
                                    <p>
                                        <TrendingUp className="inline size-4 mr-1" />
                                        Consumed
                                    </p>
                                    <p className="font-semibold">500 <span className="text-muted-foreground font-normal">kcal</span></p>
                                    <Progress value={50} className="bg-gray-100 [&>*]:bg-orange-300 mt-1" />
                                </div>
                                <div className="grid auto-rows-auto gap-[4px] place-items-start bg-green-100 px-4 py-3 rounded-lg">
                                    <p>
                                        <Target className="inline size-4 mr-1" />
                                        Goal
                                    </p>
                                    <p className="font-semibold">{daily_calories} <span className="text-muted-foreground font-normal">kcal</span></p>
                                    <Progress value={100} className="bg-gray-100 [&>*]:bg-green-300 mt-1" />
                                </div>
                            </div>
                        </Card>
                    </CarouselItem>
                    <CarouselItem>
                        <Card className="place-items-center py-4 gap-3">
                            <CardTitle>Macronutrients</CardTitle>
                            <div className="w-full px-6 grid grid-cols-[auto_1fr_1fr_1fr] grid-rows-3 items-center">
                                <div className="mr-2 row-span-2 bg-orange-300 rounded-full">
                                    <Wheat className="size-4 m-2 stroke-white" />
                                </div>
                                <p className="col-start-2 text-md">Carbs</p>
                                <p className="col-start-2 row-start-2 text-muted-foreground text-sm">100/{daily_carbs} g</p>
                                <p className="col-start-4 justify-self-end font-semibold text-md">40 g</p>
                                <p className="col-start-4 justify-self-end text-muted-foreground text-sm">remaining</p>
                                <Progress value={100} max={daily_carbs} className="col-span-4 bg-gray-100 [&>*]:bg-orange-300" />
                            </div>
                            <div className="w-full px-6 grid grid-cols-[auto_1fr_1fr_1fr] grid-rows-3 items-center">
                                <div className="mr-2 row-span-2 bg-green-300 rounded-full">
                                    <Beef className="size-4 m-2 stroke-white" />
                                </div>
                                <p className="col-start-2 text-md">Protein</p>
                                <p className="col-start-2 row-start-2 text-muted-foreground text-sm">88/{daily_protein} g</p>
                                <p className="col-start-4 justify-self-end font-semibold text-md">80 g</p>
                                <p className="col-start-4 justify-self-end text-muted-foreground text-sm">remaining</p>
                                <Progress value={80} max={daily_protein} className="col-span-4 bg-gray-100 [&>*]:bg-green-300" />
                            </div>
                            <div className="w-full px-6 grid grid-cols-[auto_1fr_1fr_1fr] grid-rows-3 items-center">
                                <div className="mr-2 row-span-2 bg-violet-300 rounded-full">
                                    <Citrus className="size-4 m-2 stroke-white" />
                                </div>
                                <p className="col-start-2 text-md">Fats</p>
                                <p className="col-start-2 row-start-2 text-muted-foreground text-sm">50/{daily_fats} g</p>
                                <p className="col-start-4 justify-self-end font-semibold">20 g</p>
                                <p className="col-start-4 justify-self-end text-muted-foreground text-sm">remaining</p>
                                <Progress value={20} max={daily_fats} className="col-span-4 bg-gray-100 [&>*]:bg-violet-300" />
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
    const navigate = useNavigate();

    const handleAddFood = () => {
        navigate("add");
    }

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
                    <Button
                        className="w-full"
                        onClick={handleAddFood}
                    >
                        <Search className="inline" />
                        Add Food
                    </Button>
                </CardAction>
            </CardContent>
        </Card>
    );
}

export { NutritionDashboard }