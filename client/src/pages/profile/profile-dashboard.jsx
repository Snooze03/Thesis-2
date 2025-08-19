"use client"

import { useQuery } from "@tanstack/react-query";
import api from "@/api";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/layouts/main-layout";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Download, Dumbbell, Flag, Apple, Target, Edit, Settings, LogOut } from "lucide-react";
import { SectionTitle, SectionSubTitle } from "@/components/ui/section-title";
import { Badge } from "@/components/ui/badge";
import { KebabMenu } from "@/components/ui/kebab-menu";
import { EmptyItems } from "@/components/empty-items";

const Profile = () => {
    const getProfile = async () => {
        const response = await api.get("accounts/profile/");
        return response.data;
    }

    const {
        data: user_data = [],
        isPending,
    } = useQuery({
        queryKey: ["account_data"],
        queryFn: getProfile,
    });

    return (
        <MainLayout>
            <SectionTitle>Profile</SectionTitle>
            <ProfileCard user={user_data} />

            <SectionSubTitle></SectionSubTitle>

            <SectionSubTitle>Generated Reports</SectionSubTitle>
            <EmptyItems title="No progress reports yet." description="make sure to properly configure the settings" />
            {/* To Loop on using back-end later */}
            {/* <Report number="1" date="March 12, 2025" description="Great progress on your strength goals! Your bench press has improved by 10% and you've been consistent with your workouts." /> */}
        </MainLayout >
    );
}

const ProfileCard = ({ user }) => {
    const navigate = useNavigate();

    const capitalize = (s) => {
        if (typeof s !== 'string' || s.length === 0) return '';
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const userName = `${capitalize(user.first_name)} ${capitalize(user.last_name)}`
    const weightDecimal = user.current_weight - Math.floor(user.current_weight);
    const weight = weightDecimal > 0 ? weightDecimal.toFixed(2) : Math.floor(user.current_weight);

    const menuItems = [
        { type: "title", label: "My Account" },
        { icon: Edit, label: "Edit", action: () => navigate("/profile/edit") },
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
                        <AvatarFallback>{(userName[0] + userName[userName.length - 1]).toUpperCase()}</AvatarFallback>
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
                            12
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
                            -5 <span className="text-gray-800 font-normal max-xs:text-xs">kg</span>
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
                    <Badge className="font-semibold max-xs:text-xs">7 days</Badge>
                </div>
            </CardContent>
        </Card >
    );
}

const ReportCard = ({ number, date, description }) => {
    return (
        <Card className="gap-2 hover:shadow-lg transition-shadow">
            <CardHeader className="grid grid-cols-2 grid-rows-2 gap-1 content-center">
                <CardTitle>Report #{number}</CardTitle>
                <CardAction className="self-start">
                    <button className={cn(
                        "flex items-center gap-2 px-4 py-1 text-sm border-2 border-primary rounded-md text-primary font-semibold cursor-pointer",
                        "hover:bg-primary hover:text-white transition delay-50 duration-200 ease-in-out ",
                        "max-xs:px-2",
                    )}>
                        <Download strokeWidth="3" className="hover:stroke-white size-4" />
                        Export
                    </button>
                </CardAction>
                <CardDescription className="max-xs:text-xs">{date}</CardDescription>
            </CardHeader>
            <CardContent className="max-xs:text-sm">
                <p>{description}</p>
            </CardContent>
        </Card>
    );
}

export { Profile }