"use client"

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api";
import { useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/layouts/main-layout";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Download, Dumbbell, Flag, Apple, Target, Calendar, Clock, Edit, Settings, LogOut } from "lucide-react";
import { SectionTitle, SectionSubTitle } from "@/components/ui/section-title";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { KebabMenu } from "@/components/ui/kebab-menu";

const Profile = () => {
    const userName = "Snooze";

    return (
        <MainLayout>

            <SectionTitle>Profile</SectionTitle>
            <ProfileCard userName={userName} />

            <SectionSubTitle>Progress Report</SectionSubTitle>
            <ReportSettings />

            <SectionSubTitle>Generated Reports</SectionSubTitle>
            {/* To Loop on using back-end later */}
            <Report number="1" date="March 12, 2025" description="Great progress on your strength goals! Your bench press has improved by 10% and you've been consistent with your workouts." />
            <Report number="2" date="April 14, 2025" description="Dolor nisi enim in esse labore incididunt tempor consequat tempor ad Est Lorem officia laboris pariatur officia duis eiusmod." />
        </MainLayout >
    );
}

const ProfileCard = ({ userName }) => {
    const navigate = useNavigate();

    const menuItems = [
        { type: "title", label: "My Account" },
        { icon: Edit, label: "Edit", action: "edit" },
        { icon: Settings, label: "Settings", action: "settings" },
        { type: "separator" },
        { icon: LogOut, label: "Logout", action: "logout", variant: "destructive" },
    ]

    return (
        <Card className="gap-3 pt-0" >
            <CardHeader className="flex justify-between items-center gap-3 py-4 bg-primary rounded-t-lg">
                <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                        <AvatarImage src="images/ken2.jpg" />
                        <AvatarFallback>{(userName[0] + userName[userName.length - 1]).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-lg text-white">{userName}</p>
                </div>

                <KebabMenu items={menuItems} onAction={() => navigate("/logout")} />
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
                            55 <span className="text-gray-800 font-normal max-xs:text-xs">kg</span>
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

const ReportSettings = () => {
    const isShort = true;
    const [reportType, setReportType] = useState(isShort);

    return (
        <Card>
            <CardContent className="space-y-4">
                {/* Days Inteval */}
                <Label htmlFor="report-interval">Generate Report Every</Label>
                <div className="grid grid-cols-3 gap-3 max-xs:grid-cols-5 max-2xs:grid-cols-6">
                    <div className="relative w-full block col-span-2 max-xs:col-span-3">
                        <Calendar className={cn(
                            "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none",
                            "max-2xs:size-4"
                        )} />
                        <Input id="report-interval" type="number" placeholder="22" className="pl-10" />
                    </div>
                    <Select>
                        <SelectTrigger className="w-full max-xs:col-span-2 max-2xs:col-span-3">
                            <SelectValue placeholder="Days" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="days">Days</SelectItem>
                            <SelectItem value="weeks">Weeks</SelectItem>
                            <SelectItem value="months">Months</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Time */}
                <Label htmlFor="report-time-interval">Time</Label>
                <div className="grid grid-cols-3 gap-3 max-xs:grid-cols-5 max-2xs:grid-cols-6">
                    <div className="relative w-full block col-start-1 col-end-3 max-xs:col-span-3">
                        <Clock className={cn(
                            "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none",
                            "max-2xs:size-4",
                        )} />
                        <Input id="report-time-interval" type="number" placeholder="10:30" className="pl-10" />
                    </div>
                    <Select>
                        <SelectTrigger className="w-full max-xs:col-span-2 max-2xs:col-span-3">
                            <SelectValue placeholder="A.M" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="am">A.M</SelectItem>
                            <SelectItem value="pm">P.M</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Report Type */}
                <Label htmlFor="report-type">Report Type</Label>
                <div className="grid grid-cols-2 gap-3">

                    {/* sets report type to short */}
                    <Card onClick={() => setReportType(isShort)}
                        className={clsx(
                            "px-1 py-2 text-sm cursor-pointer hover:bg-gray-100 hover:shadow-lg transition delay-50 duration-200 ease-in-out",
                            { "border-1 border-primary bg-primary-500 hover:bg-primary-400": reportType })}>
                        <CardContent className="px-2.5 py-1 space-y-2">
                            <CardTitle className="font-normal">Short</CardTitle>
                            <CardDescription className="text-start max-xs:text-xs">Brief overview of your progress</CardDescription>
                        </CardContent>
                    </Card>

                    {/* sets report type to detailed */}
                    <Card onClick={() => setReportType(!isShort)}
                        className={clsx(
                            "px-1 py-2 text-sm cursor-pointer hover:bg-gray-100 hover:shadow-lg transition delay-50 duration-200 ease-in-out max-2xs:px-0",
                            { "border-1 border-primary bg-primary-500 hover:bg-primary-400": !reportType })}>
                        <CardContent className="px-2.5 py-1 space-y-2">
                            <CardTitle className="font-normal">Detailed</CardTitle>
                            <CardDescription className="text-start max-xs:text-xs">In-depth analysis with personalized feedback</CardDescription>
                        </CardContent>
                    </Card>
                </div>

                <CardAction className="w-full mt-5">
                    <Button className="w-full">Save Settings</Button>
                </CardAction>
            </CardContent>
        </Card>

    );
}

const Report = ({ number, date, description }) => {
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