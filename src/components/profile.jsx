"use client"
import { useState } from "react";
import { useEffect } from "react";
import { clsx } from "clsx";
import { MainLayout } from "@/layouts/main-layout";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { Dumbbell } from "lucide-react";
import { Flag } from "lucide-react";
import { Apple } from "lucide-react";
import { Target } from "lucide-react";
import { EllipsisVertical } from "lucide-react";
import { Clock } from "lucide-react";
import { Calendar } from "lucide-react";
import * as v from "valibot";

const Profile = () => {
    // Temp user name for now
    const userName = "Snooze";

    // To do:
    // 1. Validate Inputs
    // 2. Style selected report type
    // 3. Days and Time picker
    const reportSchema = v.object({
        report_interval: v.pipe(
            v.string(),
            v.nonEmpty("Interval is required"),
            v.transform(Number),
            v.number("Must be a valid number"),
            v.minValue(7, "Minimum of 7 days")
        ),
        time_interval: v.pipe(
            v.string(),
            v.nonEmpty("Time is required"),
            v.number("Must be a time")
        )
    });

    const isShort = true;
    const [reportType, setReportType] = useState(isShort);

    useEffect(() => {
        if (reportType) console.log(`Short: ${reportType}`);
        else console.log(`Detailed ${reportType}`);
    }, [reportType])

    return (
        <MainLayout>

            <CardTitle className="text-2xl">Profile</CardTitle>
            <Card className="gap-3 pt-0">
                <CardHeader className="flex justify-between items-center gap-3 py-4 bg-primary rounded-t-md">
                    <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                            <AvatarImage src="images/ken2.jpg" />
                            <AvatarFallback>{(userName[0] + userName[userName.length - 1]).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-lg text-white">{userName}</p>
                    </div>
                    <EllipsisVertical></EllipsisVertical>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 items-center border-b-2 border-gray-300 pb-2 gap-3 md:gap-none">
                        <div className="grid grid-rows-2 gap-1 text-center">
                            <div className="flex gap-1 justify-center items-center">
                                <Dumbbell size="18" className="stroke-green-500" />
                                <p className="font-semibold text-lg">12</p>
                            </div>
                            <p className="text-gray-600">Workouts</p>
                        </div>
                        <div className="grid grid-rows-2 gap-1 text-center">
                            <div className="flex gap-1 justify-center items-center">
                                <Flag size="18" className="stroke-violet-500" />
                                <p className="font-semibold text-lg">55 kg</p>
                            </div>
                            <p className="text-gray-600">Weight</p>
                        </div>
                        <div className="grid grid-rows-2 gap-1 text-center">
                            <div className="flex gap-1 justify-center items-center">
                                <Apple size="18" className="stroke-red-400" />
                                <p className="font-semibold text-lg">-5 kg</p>
                            </div>
                            <p className="text-gray-600">Progress</p>
                        </div>
                    </div>

                    <div className="flex justify-between gap-3 mt-4">
                        <div className="flex gap-2 items-center">
                            <Target className="stroke-orange-300"></Target>
                            <div>Current Streak</div>
                        </div>
                        <Badge className="font-semibold">7 days</Badge>
                    </div>
                </CardContent>
            </Card>

            <CardTitle className="text-gray-500">Progress Report</CardTitle>
            <Card>
                <CardContent className="space-y-4">
                    {/* Days Inteval */}
                    <Label htmlFor="report-interval">Generate Report Every</Label>
                    <div className="grid grid-cols-3  gap-3">
                        <div className="relative w-full block col-start-1 col-end-3">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                            <Input id="report-interval" type="number" placeholder="22" className="pl-10" />
                        </div>
                        <Select>
                            <SelectTrigger className="w-full">
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
                    <div className="grid grid-cols-3 gap-3">
                        <div className="relative w-full block col-start-1 col-end-3">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                            <Input id="report-time-interval" type="number" placeholder="10:30" className="pl-10" />
                        </div>
                        <Select>
                            <SelectTrigger className="w-full">
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
                        <Card onClick={() => setReportType(true)}
                            className="px-1 py-2 text-sm hover:bg-gray-100 transition delay-50 duration-200 ease-in-out">
                            <CardContent className="px-2.5 py-1 space-y-2">
                                <CardTitle className="font-normal">Short</CardTitle>
                                <CardDescription className="text-start text-xs">Brief overview of your progress</CardDescription>
                            </CardContent>
                        </Card>
                        {/* sets report type to detailed */}
                        <Card onClick={() => setReportType(false)} className="px-1 py-2 text-sm">
                            <CardContent className="px-2.5 py-1 space-y-2">
                                <CardTitle className="font-normal">Detailed</CardTitle>
                                <CardDescription className="text-start text-xs">In-depth analysis with personalized recommendations</CardDescription>
                            </CardContent>
                        </Card>
                    </div>

                    <Button className="w-full mt-2">Save Settings</Button>
                </CardContent>
            </Card>

            <CardTitle className="text-gray-500">Previous Reports</CardTitle>
            <Card className="gap-2">
                <CardHeader className="grid grid-cols-2 grid-rows-2 gap-1 content-center">
                    {/* To Loop on using back-end later */}
                    <CardTitle>Report #1</CardTitle>
                    <CardAction className="self-start">
                        <button className="flex items-center gap-2 px-4 py-1 text-sm border-2 border-primary rounded-md text-primary font-semibold">
                            <Download size="18" strokeWidth="3" />
                            Export
                        </button>
                    </CardAction>
                    <CardDescription>March 12 2025</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Great progress on your strength goals! Your bench press has improved by 10% and you've been consistent with your workouts.</p>
                </CardContent>
            </Card>
        </MainLayout >
    );
}

export { Profile }