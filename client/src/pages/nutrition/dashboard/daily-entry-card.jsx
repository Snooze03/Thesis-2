import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardAction, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Coffee, Sandwich, Carrot, Drumstick, Search, Eye } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/utils/formatDate";
import { FoodDetailsDialog } from "./food-details-dialog";
import { cn } from "@/lib/utils";

export function DailyEntryCard({ dailyEntry }) {
    const navigate = useNavigate();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedFoodId, setSelectedFoodId] = useState(null);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [foodDatabaseId, setFoodDatabaseId] = useState(null);
    const meals = dailyEntry.meals_breakdown;
    const todayPH = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    const isToday = dailyEntry.date === todayPH;

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

    const handleAddFood = () => {
        navigate("add");
    };

    const handleFoodDetails = (entry) => {
        // Extract the id's from the entry
        const entryId = entry.id;
        const foodDbId = entry.food_database_id;

        console.log(`Entry Details:`, { ...entry });

        if (entryId && foodDbId) {
            setSelectedEntry(entryId);
            setFoodDatabaseId(foodDbId);
            setDialogOpen(true);
        } else {
            console.warn('No food ID found in entry:', entry);
        }
    }

    return (
        <>
            <Card>
                <CardContent>
                    <CardTitle>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Calendar className="size-4" />
                                <p>{formatDate(dailyEntry.date)}</p>
                                {isToday && (
                                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                                        Today
                                    </span>
                                )}
                            </div>
                            <p className="text-sm font-medium">
                                {dailyEntry.total_calories.toFixed(0)} / {dailyEntry.nutrition_goals?.daily_calories_goal || 0} cal
                            </p>
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
                                        <p className={`text-sm text-black ${mealStyle.bgColor} px-3 py-[1px] rounded-full`}>
                                            {mealData.totals?.calories?.toFixed(0) || 0}
                                        </p>
                                    </div>
                                    <Separator className="mt-1" />

                                    {/* Food entries */}
                                    {mealData.entries && mealData.entries.length > 0 ? (
                                        <div className="mt-2 space-y-2">
                                            {/* {mealData.entries.slice(0, 2).map((entry, index) => ( */}
                                            {mealData.entries.map((entry, index) => (
                                                <div
                                                    key={index}
                                                    className={cn(
                                                        "flex justify-between gap-3 px-3 py-1 rounded-md",
                                                        "cursor-pointer hover:bg-gray-100"
                                                    )}
                                                    onClick={() => handleFoodDetails(entry)}
                                                >
                                                    <div className="space-y-[.5px]">
                                                        <p className="text-sm text-gray-800 truncate">
                                                            {entry.food_name} - {entry.quantity}x
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {entry.food_brand ? `${entry.food_brand} • ${entry.serving_description}` : entry.serving_description}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        {entry.calories.toFixed(0)}
                                                    </p>
                                                </div>
                                            ))}
                                            {/* {mealData.entries.length > 2 && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                +{mealData.entries.length - 2} more items...
                                            </p>
                                        )} */}
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

                    {/* Only show Add Food button for today's entry */}
                    <CardAction className="w-full mt-5">
                        {isToday ? (
                            <Button
                                className="w-full"
                                onClick={handleAddFood}
                            >
                                <Search className="inline" />
                                Add Food
                            </Button>
                        ) : (
                            <Button
                                className="w-full"
                                // onClick={handleViewDetails}
                                variant="outline"
                            >
                                <Search className="inline" />
                                View Details
                            </Button>
                        )}
                    </CardAction>
                </CardContent>
            </Card >

            <FoodDetailsDialog
                isOpen={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                    setSelectedFoodId(null);
                }}
                foodId={selectedFoodId}
                foodDatabaseId={foodDatabaseId}
                entryId={selectedEntry}
            />
        </>
    );
}