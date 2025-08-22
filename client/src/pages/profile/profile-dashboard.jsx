"use client"

import { useQuery } from "@tanstack/react-query";
import api from "@/api";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/layouts/main-layout";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Download, Dumbbell, Flag, Apple, Target, Edit, Settings, LogOut, TrendingUp } from "lucide-react";
import { SectionTitle, SectionSubTitle } from "@/components/ui/section-title";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts"
import { Badge } from "@/components/ui/badge";
import { KebabMenu } from "@/components/ui/kebab-menu";
import { EmptyItems } from "@/components/empty-items";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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


    if (isPending) return <LoadingSpinner message="Profile" />

    const account_data = user_data.data;
    const account_profile = user_data.data.profile;
    // console.log(account_profile);

    return (
        <MainLayout>
            <SectionTitle>Profile</SectionTitle>
            <ProfileCard acc_data={account_data} acc_profile={account_profile} />

            <SectionSubTitle>Weight Logs</SectionSubTitle>
            <WeightManager />

            <SectionSubTitle>Generated Reports</SectionSubTitle>
            {/* <EmptyItems title="No progress reports yet." description="make sure to properly configure the settings" /> */}
            {/* To Loop on using back-end later */}
            <ReportCard number="1" date="March 12, 2025" description="Great progress on your strength goals! Your bench press has improved by 10% and you've been consistent with your workouts." />
        </MainLayout >
    );
}

const ProfileCard = ({ acc_data, acc_profile }) => {
    const navigate = useNavigate();

    const capitalize = (s) => {
        if (typeof s !== 'string' || s.length === 0) return '';
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const first_name = acc_data.first_name;
    const userName = `${capitalize(acc_data.first_name)} ${capitalize(acc_data.last_name)}`
    const weight = Number(acc_profile.current_weight).toFixed(2);

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

const WeightManager = () => {
    const chartConfig = {
        weight: {
            label: "Weight",
            color: "var(--chart-1)",
        },
    };

    const {
        data: weightHistory = [],
        isPending,
        isError
    } = useQuery({
        queryKey: ["weight_history"],
        queryFn: async () => {
            const response = await api.get("accounts/weight-history/recent/");
            // console.log(response.data.data);
            return response.data.data;
        }
    });

    // Gets chart data from response and sort it from old -> new logs
    const chartData = [...weightHistory]
        .sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date))
        .slice(-10)
        .map((entry) => ({
            month: new Date(entry.recorded_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            }),
            weight: parseFloat(entry.weight),
        }))


    if (isPending) return <LoadingSpinner message="Chart" />

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between gap-3 items-center">
                    <div className="flex flex-col gap-1">
                        <CardTitle>Weight Progress</CardTitle>
                        <CardDescription>Recent entries</CardDescription>
                    </div>
                    <div>
                        <KebabMenu />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <LineChart
                        data={chartData}
                        margin={{
                            top: 20,
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            interval="preserveStartEnd"
                            tickFormatter={(value, index) => (index % 2 === 0 ? value : "")} // only show every 2nd label
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <Line
                            dataKey="weight"
                            type="natural"
                            stroke="var(--chart-1)"
                            strokeWidth={2}
                            dot={{ fill: "var(--chart-1)" }}
                            activeDot={{ r: 6 }}
                        >
                            <LabelList
                                position="top"
                                offset={12}
                                className="fill-foreground"
                                fontSize={12}
                            />
                        </Line>
                    </LineChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex items-center text-sm">
                <div className="text-muted-foreground leading-none">
                    Showing your most recent {weightHistory.length} entries <TrendingUp className="size-4 inline" />
                </div>
            </CardFooter>
        </Card>
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