import { useNavigate } from "react-router-dom";
import { Card, CardAction, CardContent, CardTitle } from "@/components/ui/card";
import { Search, Calendar, Coffee, Drumstick, Carrot, Sandwich } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/formatDate";
import { Separator } from "@/components/ui/separator";

export function FoodEntry({ dailyEntry }) {
    const navigate = useNavigate();
    const meals = dailyEntry.meals_breakdown;

    // Color mapping
    const mealStyles = {
        breakfast: {
            bgColor: "bg-orange-300",
            iconColor: "text-orange-400",
            icon: <Coffee className="size-4" />
        },
        lunch: {
            bgColor: "bg-purple-300",
            iconColor: "text-purple-400",
            icon: <Sandwich className="size-4" />
        },
        dinner: {
            bgColor: "bg-blue-300",
            iconColor: "text-blue-400",
            icon: <Drumstick className="size-4" />
        },
        snack: {
            bgColor: "bg-green-300",
            iconColor: "text-green-400",
            icon: <Carrot className="size-4" />
        }
    };

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
                    {Object.entries(meals).map(([mealType, mealData]) => {
                        const mealStyle = mealStyles[mealType] || {
                            bgColor: "bg-gray-300",
                            iconColor: "text-gray-600",
                            icon: <Calendar className="size-4" />
                        };

                        return (
                            <div key={mealType}>
                                {/* Meal type (breakfast, lunch etc) */}
                                <div className="flex justify-between items-center">
                                    <div className="capitalize flex items-center gap-2">
                                        <span className={mealStyle.iconColor}>
                                            {mealStyle.icon}
                                        </span>
                                        <h3>{mealData.name || mealType}</h3>
                                    </div>
                                    <p className={`text-sm text-black ${mealStyle.bgColor} px-3 py-[.5px] rounded-full`}>
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
                                                    {entry.calories}
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
                        );
                    })}
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