import { useNavigate } from "react-router-dom";
import { Card, CardAction, CardContent, CardTitle } from "@/components/ui/card";
import { Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/formatDate";
import { Separator } from "@/components/ui/separator";

export function FoodEntry({ dailyEntry }) {
    const navigate = useNavigate();
    const meals = dailyEntry.meals_breakdown;
    console.log(`Meals: ${meals}`);

    const handleAddFood = () => {
        navigate("add");
    }

    return (
        <Card>
            <CardContent>
                <CardTitle>
                    <div className="flex justify-center items-center gap-2">
                        <Calendar className="size-4" />
                        <p>{formatDate(dailyEntry.date)}</p>
                    </div>
                </CardTitle>

                <div className="space-y-4 mt-4">
                    {Object.entries(meals).map(([mealType, mealData]) => (
                        <div key={mealType}>
                            {/* Meal type (breakfast, lunch etc) */}
                            <div className="flex justify-between items-center">
                                <h3 className="capitalize">
                                    {mealData.name || mealType}
                                </h3>
                                <p className="text-sm text-black bg-orange-300 px-3 py-[.5px]  rounded-full">
                                    {mealData.totals?.calories || 0} cal
                                </p>
                            </div>
                            <Separator className="mt-1" />

                            {/* Food entries */}
                            {mealData.entries && mealData.entries.length > 0 ? (
                                <div className="mt-2">
                                    {mealData.entries.map((entry, index) => (
                                        <div key={index} className="flex justify-between gap-3">
                                            <p className="text-sm text-gray-700">
                                                {entry.food_name} - {entry.quantity}x
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {entry.protein}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground mt-2 italic">
                                    No foods added
                                </p>
                            )}

                        </div>
                    ))}
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