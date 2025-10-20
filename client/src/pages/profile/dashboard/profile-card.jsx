import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { KebabMenu } from "@/components/ui/kebab-menu";
import { Dumbbell, Flag, Apple, Target, Edit, Settings, LogOut } from "lucide-react";

export const ProfileCard = ({ acc_data, acc_profile }) => {
    const navigate = useNavigate();

    const capitalize = (s) => {
        if (typeof s !== 'string' || s.length === 0) return '';
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    // Get the latest weight from weight history, fallback to current_weight from profile
    const getLatestWeight = () => {
        if (acc_data.weight_history && acc_data.weight_history.length > 0) {
            // Weight history is ordered by most recent first
            return Number(acc_data.weight_history[0].weight).toFixed(2);
        }
        // Fallback to profile current_weight if no weight history
        return Number(acc_profile.current_weight).toFixed(2);
    };

    const first_name = acc_data.first_name;
    const userName = `${capitalize(acc_data.first_name)} ${capitalize(acc_data.last_name)}`
    const weight = getLatestWeight();

    const menuItems = [
        { type: "title", label: "My Account" },
        {
            icon: Edit,
            label: "Edit",
            action: () => navigate("/profile/edit", {
                state: { userData: { ...acc_data, profile: acc_profile } }
            })
        },
        { icon: Settings, label: "Settings", action: () => navigate("/profile/settings") },
        { type: "separator" },
        { icon: LogOut, label: "Logout", action: () => navigate("/logout"), variant: "destructive" },
    ]

    return (
        <Card className="gap-3 pt-0" >
            <CardHeader className="flex justify-between items-center gap-3 py-4 bg-primary rounded-t-lg">
                <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                        <AvatarImage />
                        <AvatarFallback>{(first_name[0] + first_name[first_name.length - 1]).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-lg text-white">{userName}</p>
                </div>

                <KebabMenu items={menuItems} />
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 items-center border-b-2 border-gray-300 pb-2 gap-3 md:gap-none">
                    {/* Stats */}
                    <div className="grid grid-rows-2 place-items-center">
                        <p className="font-semibold text-lg max-xs:text-md">
                            <Dumbbell className="inline mr-1.5 stroke-green-500 size-4 max-xs:size-4 " />
                            0
                        </p>
                        <p className="text-gray-600 max-xs:text-sm">Workouts</p>
                    </div>

                    <div className="grid grid-rows-2 place-items-center">
                        <p className="font-semibold text-lg max-xs:text-md">
                            <Flag className="inline mr-1.5 stroke-violet-500 size-4 max-xs:size-4" />
                            {weight} <span className="text-gray-800 font-normal max-xs:text-xs">kg</span>
                        </p>
                        <p className="text-gray-600 max-xs:text-sm">Weight</p>
                    </div>

                    <div className="grid grid-rows-2 place-items-center ">
                        <p className="font-semibold text-lg max-xs:text-md">
                            <Apple className="inline mr-1.5 stroke-red-400 size-4 max-xs:size-4" />
                            {acc_profile.weight_progress} <span className="text-gray-800 font-normal max-xs:text-xs">kg</span>
                        </p>
                        <p className="text-gray-600 max-xs:text-sm">Progress</p>
                    </div>
                </div>

                {/* Streak Stat */}
                <div className="flex justify-between gap-3 mt-4">
                    <div className="max-xs:text-sm flex items-center ">
                        <Target className="mr-3 stroke-orange-300 size-5 max-xs:size-4" />
                        Current Streak
                    </div>
                    <Badge className="font-semibold max-xs:text-xs">0 days</Badge>
                </div>
            </CardContent>
        </Card >
    );
}