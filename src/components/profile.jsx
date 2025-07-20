"use client"
import { useState } from "react";
import { clsx } from "clsx";
import { MainLayout } from "@/layouts/main-layout";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Download, Dumbbell, Flag, Apple, Target, EllipsisVertical, Calendar, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import * as v from "valibot";

const Profile = () => {
    // Temp user name for now
    const userName = "Snooze";

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

    // useEffect(() => {
    //     if (reportType) console.log(`Short: ${reportType}`);
    //     else console.log(`Detailed ${reportType}`);
    // }, [reportType])

    return (
        <MainLayout>

            <CardTitle className="text-2xl">Profile</CardTitle>
            {/* Profile Card */}
            <Card className="@container/profile gap-3 pt-0">
                <CardHeader className="flex justify-between items-center gap-3 py-4 bg-primary rounded-t-md">
                    <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                            <AvatarImage src="images/ken2.jpg" />
                            <AvatarFallback>{(userName[0] + userName[userName.length - 1]).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-lg text-white">{userName}</p>
                    </div>
                    <KebabMenu />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 items-center border-b-2 border-gray-300 pb-2 gap-3 md:gap-none">
                        {/* Stats */}
                        <div className="grid grid-rows-2 gap-1 text-center">
                            <div className="flex gap-1 justify-center items-center">
                                <Dumbbell className="stroke-green-500 size-4 @max-xs/profile:size-3" />
                                <p className="font-semibold text-lg @max-xs/profile:text-sm">12</p>
                            </div>
                            <p className="text-gray-600 @max-xs/profile:text-sm">Workouts</p>
                        </div>
                        <div className="grid grid-rows-2 gap-1 text-center">
                            <div className="flex gap-1 justify-center items-center">
                                <Flag className="stroke-violet-500 size-4 @max-xs/profile:size-3" />
                                <p className="font-semibold text-lg @max-xs/profile:text-sm">55 kg</p>
                            </div>
                            <p className="text-gray-600 @max-xs/profile:text-sm">Weight</p>
                        </div>
                        <div className="grid grid-rows-2 gap-1 text-center">
                            <div className="flex gap-1 justify-center items-center">
                                <Apple className="stroke-red-400 size-4 @max-xs/profile:size-3" />
                                <p className="font-semibold text-lg @max-xs/profile:text-sm">-5 kg</p>
                            </div>
                            <p className="text-gray-600 @max-xs/profile:text-sm">Progress</p>
                        </div>
                    </div>

                    {/* Streak Stat */}
                    <div className="flex justify-between gap-3 mt-4">
                        <div className="flex gap-2 items-center">
                            <Target className="stroke-orange-300 size-5 @max-xs/profile:size-4"></Target>
                            <div className="@max-xs/profile:text-sm">Current Streak</div>
                        </div>
                        <Badge className="font-semibold @max-xs/profile:text-xs">7 days</Badge>
                    </div>
                </CardContent>
            </Card>

            <CardTitle className="text-gray-500">Progress Report</CardTitle>
            <Card className="@container/report">
                <CardContent className="space-y-4">
                    {/* Days Inteval */}
                    <Label htmlFor="report-interval">Generate Report Every</Label>
                    <div className="grid grid-cols-3 gap-3 @max-xs/report:grid-cols-5 @max-2xs:grid-cols-6">
                        <div className="relative w-full block col-span-2 @max-xs/report:col-span-3">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                            <Input id="report-interval" type="number" placeholder="22" className="pl-10" />
                        </div>
                        <Select>
                            <SelectTrigger className="w-full @max-xs/report:col-span-2 @max-2xs/report:col-span-3">
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
                    <div className="grid grid-cols-3 gap-3 @max-xs/report:grid-cols-5 @max-2xs/report:grid-cols-6">
                        <div className="relative w-full block col-start-1 col-end-3 @max-xs/report:col-span-3">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                            <Input id="report-time-interval" type="number" placeholder="10:30" className="pl-10" />
                        </div>
                        <Select>
                            <SelectTrigger className="w-full @max-xs/report:col-span-2 @max-2xs/report:col-span-3">
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
                                "px-1 py-2 text-sm cursor-pointer hover:bg-gray-100 transition delay-50 duration-200 ease-in-out",
                                { "border-1 border-primary bg-primary-500 hover:bg-primary-400": reportType })}>
                            <CardContent className="px-2.5 py-1 space-y-2">
                                <CardTitle className="font-normal">Short</CardTitle>
                                <CardDescription className="text-start @max-sm/report:text-xs @max-xs/report:text-2xs">Brief overview of your progress</CardDescription>
                            </CardContent>
                        </Card>

                        {/* sets report type to detailed */}
                        <Card onClick={() => setReportType(!isShort)}
                            className={clsx(
                                "px-1 py-2 text-sm cursor-pointer hover:bg-gray-100 transition delay-50 duration-200 ease-in-out @max-2xs:px-0",
                                { "border-1 border-primary bg-primary-500 hover:bg-primary-400": !reportType })}>
                            <CardContent className="px-2.5 py-1 space-y-2">
                                <CardTitle className="font-normal">Detailed</CardTitle>
                                <CardDescription className="text-start @max-sm/report:text-xs @max-xs/report:text-2xs">In-depth analysis with personalized recommendations</CardDescription>
                            </CardContent>
                        </Card>
                    </div>

                    <Button className="w-full mt-2">Save Settings</Button>
                </CardContent>
            </Card>

            <CardTitle className="text-gray-500">Previous Reports</CardTitle>
            <Card className="@container/previous gap-2">
                <CardHeader className="grid grid-cols-2 grid-rows-2 gap-1 content-center">
                    {/* To Loop on using back-end later */}
                    <CardTitle>Report #1</CardTitle>
                    <CardAction className="self-start">
                        <button className="flex items-center gap-2 px-4 py-1 text-sm border-2 border-primary rounded-md text-primary font-semibold cursor-pointer hover:bg-primary hover:text-white transition delay-50 duration-200 ease-in-out @max-xs/previous:px-2">
                            <Download strokeWidth="3" className="hover:stroke-white size-4 @max-xs/previous:size-3" />
                            Export
                        </button>
                    </CardAction>
                    <CardDescription className="@max-xs/previous:text-xs">March 12 2025</CardDescription>
                </CardHeader>
                <CardContent className="@max-xs/previous:text-xs">
                    <p>Great progress on your strength goals! Your bench press has improved by 10% and you've been consistent with your workouts.</p>
                </CardContent>
            </Card>

        </MainLayout >
    );
}

const KebabMenu = () => {
    const [openDialog, setOpenDialog] = useState(false);
    const [openProgress, setProgress] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <EllipsisVertical />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-auto">
                    <DropdownMenuLabel className="font-semibold">My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* Dialog Trigger nested in dropdown */}
                    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                        <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={e => e.preventDefault()}>
                                Edit Profile
                            </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="font-semibold">Edit Profile</DialogTitle>
                                <DialogDescription>
                                    Make changes to your profile here. Click save when you're done.
                                </DialogDescription>
                            </DialogHeader>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={() => alert('Saved!')}>Save</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Progress Dialog */}
                    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                        <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={e => e.preventDefault()}>
                                Update Progress
                            </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="font-semibold">Edit Profile</DialogTitle>
                                <DialogDescription>
                                    Make changes to your profile here. Click save when you're done.
                                </DialogDescription>
                            </DialogHeader>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={() => alert('Saved!')}>Save</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}

export { Profile }