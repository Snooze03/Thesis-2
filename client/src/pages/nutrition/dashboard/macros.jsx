import { Card, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { RadialProgress } from "@/components/ui/radial-progress";
import { Progress } from "@/components/ui/progress";
import { Zap, Wheat, Beef, Citrus, TrendingUp, Target } from "lucide-react";

export function Macros({ dailyEntry }) {
    const nutrition_goals = dailyEntry ? dailyEntry.nutrition_goals : null;
    const daily_calories = nutrition_goals.daily_calories_goal;
    const daily_carbs = nutrition_goals.daily_carbs_goal;
    const daily_protein = nutrition_goals.daily_protein_goal;
    const daily_fats = nutrition_goals.daily_fat_goal;

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

                            <RadialProgress value={dailyEntry.total_calories} max={daily_calories} size="xl" label="remaining" className="-mb-5" />
                            <div className="grid grid-cols-2 gap-3 text-sm p-4 -mb-2">
                                <div className="grid auto-rows-auto gap-[4px] place-items-start bg-orange-100 px-4 py-3 rounded-lg">
                                    <p>
                                        <TrendingUp className="inline size-4 mr-1" />
                                        Consumed
                                    </p>
                                    <p className="font-semibold">
                                        {dailyEntry.total_calories}
                                        <span className="text-muted-foreground font-normal ml-1">
                                            kcal
                                        </span>
                                    </p>
                                    <Progress value={dailyEntry.total_calories} className="bg-gray-100 [&>*]:bg-orange-300 mt-1" />
                                </div>
                                <div className="grid auto-rows-auto gap-[4px] place-items-start bg-green-100 px-4 py-3 rounded-lg">
                                    <p>
                                        <Target className="inline size-4 mr-1" />
                                        Goal
                                    </p>
                                    <p className="font-semibold">
                                        {daily_calories}
                                        <span className="text-muted-foreground font-normal ml-1">
                                            kcal
                                        </span>
                                    </p>
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
                                <p className="col-start-2 row-start-2 text-muted-foreground text-sm">
                                    {dailyEntry.total_carbs}/{daily_carbs} g
                                </p>
                                <p className="col-start-4 justify-self-end font-semibold text-md">
                                    {(daily_carbs - dailyEntry.total_carbs).toFixed(2)} g
                                </p>
                                <p className="col-start-4 justify-self-end text-muted-foreground text-sm">remaining</p>
                                <Progress value={dailyEntry.total_carbs} max={daily_carbs} className="col-span-4 bg-gray-100 [&>*]:bg-orange-300" />
                            </div>

                            <div className="w-full px-6 grid grid-cols-[auto_1fr_1fr_1fr] grid-rows-3 items-center">
                                <div className="mr-2 row-span-2 bg-green-300 rounded-full">
                                    <Beef className="size-4 m-2 stroke-white" />
                                </div>
                                <p className="col-start-2 text-md">Protein</p>
                                <p className="col-start-2 row-start-2 text-muted-foreground text-sm">
                                    {dailyEntry.total_protein}/{daily_protein} g
                                </p>
                                <p className="col-start-4 justify-self-end font-semibold text-md">
                                    {(daily_protein - dailyEntry.total_protein).toFixed(2)} g
                                </p>
                                <p className="col-start-4 justify-self-end text-muted-foreground text-sm">remaining</p>
                                <Progress value={dailyEntry.total_protein} max={daily_protein} className="col-span-4 bg-gray-100 [&>*]:bg-green-300" />
                            </div>

                            <div className="w-full px-6 grid grid-cols-[auto_1fr_1fr_1fr] grid-rows-3 items-center">
                                <div className="mr-2 row-span-2 bg-violet-300 rounded-full">
                                    <Citrus className="size-4 m-2 stroke-white" />
                                </div>
                                <p className="col-start-2 text-md">Fats</p>
                                <p className="col-start-2 row-start-2 text-muted-foreground text-sm">
                                    {dailyEntry.total_fat}/{daily_fats} g
                                </p>
                                <p className="col-start-4 justify-self-end font-semibold">
                                    {(daily_fats - dailyEntry.total_fat).toFixed(2)} g
                                </p>
                                <p className="col-start-4 justify-self-end text-muted-foreground text-sm">remaining</p>
                                <Progress value={dailyEntry.total_fat} max={daily_fats} className="col-span-4 bg-gray-100 [&>*]:bg-violet-300" />
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
