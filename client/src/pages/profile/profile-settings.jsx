import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSettings, useUpdateSettings } from "@/hooks/assistant/useProgressReportSettings";
import { useScrollLock } from "@/hooks/useScrollLock";
import { clsx } from "clsx";
import { SubLayout } from "@/layouts/sub-layout";
import { SectionTitle, SectionSubTitle, SectionSubText } from "@/components/ui/section-title";
import { Card, CardContent, CardAction, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Minus, StickyNote, NotepadText, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
    const [isShort, setIsShort] = useState(true);
    const [daysInterval, setDaysInterval] = useState(7);
    const [lastGeneratedAt, setLastGeneratedAt] = useState(null);
    const [nextReportDate, setNextReportDate] = useState(null);

    const {
        settings,
        isLoading,
        isError
    } = fetchSettings();

    const {
        updateSettings,
        isLoading: isUpdating,
        isError: isUpdateError
    } = useUpdateSettings();

    // Initialize state with fetched settings
    useEffect(() => {
        if (settings) {
            setIsShort(settings.report_type === 'short');
            setDaysInterval(settings.day_interval || 7);
            setLastGeneratedAt(settings.last_generated_display);
            setNextReportDate(settings.next_generation_display);
        }
    }, [settings]);

    // ===== EVENT HANDLERS =====
    const handleIncreaseInterval = () => {
        setDaysInterval((prev) => prev + 1);
    };

    const handleDecreaseInterval = () => {
        if (daysInterval > 7) {
            setDaysInterval((prev) => prev - 1);
        }
    };

    const handleSaveSettings = () => {
        const updateData = {
            id: settings.id,
            day_interval: daysInterval,
            report_type: isShort ? 'short' : 'detailed',
        };
        updateSettings(updateData);
    };
    // ===== END EVENT HANDLERS =====

    useScrollLock(isLoading);

    if (isLoading) {
        return (
            <>
                <SectionSubTitle>Progress Report</SectionSubTitle>
                <Skeleton className="h-80 w-full" />
            </>
        );
    }

    return (
        <>
            <SectionSubTitle>Progress Report</SectionSubTitle>
            <Card>
                <CardContent className="space-y-4">
                    {/* Days Interval */}
                    <Label htmlFor="report-interval">Report Interval</Label>
                    <div className="flex gap-5 place-items-center px-15 py-3 bg-gray-100 rounded-lg shadow-inner ">
                        <Button
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-full bg-white shadow-md"
                            onClick={handleDecreaseInterval}
                            disabled={daysInterval <= 7 || isUpdating}
                        >
                            <Minus className="stroke-black" />
                        </Button>
                        <div className="flex-1 text-center">
                            <div className="text-5xl font-bold tracking-tighter">
                                {daysInterval}
                            </div>
                            <div className="text-muted-foreground text-[0.70rem] uppercase">
                                Day/s
                            </div>
                        </div>
                        <Button
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-full bg-white shadow-md"
                            onClick={handleIncreaseInterval}
                            disabled={isUpdating}
                        >
                            <Plus className="stroke-black" />
                        </Button>
                    </div>

                    {/* Report Type */}
                    <Label htmlFor="report-type">Report Type</Label>
                    <div className="grid grid-cols-2 gap-3">

                        {/* sets report type to short */}
                        <Card onClick={() => !isUpdating && setIsShort(true)}
                            className={clsx(
                                "px-1 py-2 text-sm cursor-pointer hover:bg-gray-100 hover:shadow-lg transition delay-50 duration-200 ease-in-out",
                                { "border-1 border-primary bg-primary-500 hover:bg-primary-400": isShort },
                                { "cursor-not-allowed opacity-50": isUpdating }
                            )}>
                            <CardContent className="px-2.5 py-1 space-y-2">
                                <CardTitle className="font-normal">
                                    <StickyNote className="inline mr-1 size-4" />
                                    Short
                                </CardTitle>
                                <CardDescription className="text-start max-xs:text-xs">Brief overview of your progress</CardDescription>
                            </CardContent>
                        </Card>

                        {/* sets report type to detailed */}
                        <Card onClick={() => !isUpdating && setIsShort(false)}
                            className={clsx(
                                "px-1 py-2 text-sm cursor-pointer hover:bg-gray-100 hover:shadow-lg transition delay-50 duration-200 ease-in-out max-2xs:px-0",
                                { "border-1 border-primary bg-primary-500 hover:bg-primary-400": !isShort },
                                { "cursor-not-allowed opacity-50": isUpdating }
                            )}>
                            <CardContent className="px-2.5 py-1 space-y-2">
                                <CardTitle className="font-normal">
                                    <NotepadText className="inline mr-1 size-4" />
                                    Detailed
                                </CardTitle>
                                <CardDescription className="text-start max-xs:text-xs">In-depth analysis with personalized feedback</CardDescription>
                            </CardContent>
                        </Card>
                    </div>

                    <CardAction className="w-full mt-5">
                        <Button
                            className="w-full"
                            onClick={handleSaveSettings}
                            disabled={isUpdating}
                        >
                            {isUpdating ? "Saving..." : "Save Settings"}
                        </Button>
                    </CardAction>
                </CardContent>
            </Card>

            <SectionSubTitle>Report Dates</SectionSubTitle>
            <Card>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                            <Calendar className="size-4 text-gray-700 mt-1" />
                            <div>
                                <p className="text-sm text-gray-600">Last generated</p>
                                <p className="text-gray-600 font-semibold">
                                    {lastGeneratedAt ? lastGeneratedAt.split("a")[0] : "Never"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-sky-50 border border-sky-200">
                            <Calendar className="size-4 text-sky-700 mt-1" />
                            <div>
                                <p className="text-sm text-sky-600">Next generation</p>
                                <p className="text-sky-600 font-semibold">
                                    {nextReportDate || "Not scheduled"}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>

    );
}