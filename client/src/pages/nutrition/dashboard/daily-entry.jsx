import { useNavigate } from "react-router-dom";
import { Card, CardAction, CardContent } from "@/components/ui/card";
import { Coffee, Utensils, Moon, Cookie, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AddFood() {
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