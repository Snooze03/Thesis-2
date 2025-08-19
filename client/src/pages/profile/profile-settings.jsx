"use client"

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { clsx } from "clsx";
import { SubLayout } from "@/layouts/sub-layout";
import { SectionTitle, SectionSubTitle } from "@/components/ui/section-title";
import { Card, CardContent, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, Clock } from "lucide-react";

export function ProfileSettings() {
    const navigate = useNavigate();

    return (
        <SubLayout>
            <div className="flex gap-2 items-center">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft className="size-5" />
                </Button>
                <SectionTitle>Settings</SectionTitle>
            </div>

            <ReportSettings />

        </SubLayout>
    );
}

const ReportSettings = () => {
    const isShort = true;
    const [reportType, setReportType] = useState(isShort);

    return (
        <>
            <SectionSubTitle>Progress Report</SectionSubTitle>
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
        </>

    );
}
