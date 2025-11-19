import { useLocation, useNavigate } from "react-router-dom";
import { fetchProgressReportDetails } from "@/hooks/assistant/useProgressReport";
import { SubLayout } from "@/layouts/sub-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/section-title";
import { Calendar, ArrowLeft, TrendingUp, Dumbbell, Drumstick, Lightbulb } from "lucide-react";
import { formatValueWithBold } from "../utils/formatValueWithBold";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { RecommendationsList } from "../utils/recommendationLists";
import { parseBulletList } from "../utils/parseBulletLists";


export function ProgressReportView() {
    const location = useLocation();
    const navigate = useNavigate();
    const reportId = location.state?.reportId;

    const {
        data,
        isLoading,
        isError
    } = fetchProgressReportDetails(reportId);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (isError) {
        return <div>Error loading report</div>;
    }

    // Parse key takeaways into array
    const keyTakeaways = parseBulletList(data?.key_takeaways);

    console.log("Progress Report Details:", data);

    return (
        <SubLayout>
            <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => navigate(-1, { replace: true })}>
                    <ArrowLeft className="size-4" />
                </Button>
                <SectionTitle>Report #{reportId}</SectionTitle>
            </div>

            <Card className="flex place-items-center py-2 px-4">
                <div className="flex flex-row items-center gap-2">
                    <Calendar className="size-4 text-gray-500" />
                    <p className="text-gray-700">{data?.period_display}</p>
                </div>
            </Card>

            {/* Progress Summary */}
            <Card className="gap-2 bg-green-100/60 shadow-none border-none">
                <CardHeader>
                    <CardTitle>
                        <TrendingUp className="size-4 inline mr-2 stroke-green-500" />
                        Progress Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <MarkdownRenderer content={data?.progress_summary || ""} className="text-gray-800" />
                </CardContent>
            </Card>

            {/* Workout Feedback */}
            <Card className="gap-2 bg-orange-100/60 shadow-none border-none">
                <CardHeader>
                    <CardTitle>
                        <Dumbbell className="size-4 inline mr-2 stroke-orange-500" />
                        Workout Feedback
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <MarkdownRenderer content={data?.workout_feedback || ""} className="text-gray-800" />

                    <div className="grid grid-cols-2 gap-4 place-items-center">
                        <div className="w-full h-full flex flex-col justify-center gap-1 px-4 py-2 rounded-lg bg-orange-200/80 text-sm text-gray-800">
                            <p className="font-medium">Current Frequency</p>
                            <p>{formatValueWithBold(data?.workout_frequency)}</p>
                        </div>
                        <div className="w-full h-full flex flex-col justify-center gap-1 px-4 py-2 rounded-lg bg-orange-200/80 text-sm text-gray-800">
                            <p className="font-medium">Average Duration</p>
                            <p>{formatValueWithBold(data?.workout_duration)}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-semibold mb-2">Recommendations:</p>
                        <RecommendationsList content={data?.workout_recommendations} variant="orange" />
                    </div>
                </CardContent>
            </Card>

            {/* Nutrition Feedback */}
            <Card className="gap-2 bg-sky-100/60 shadow-none border-none">
                <CardHeader>
                    <CardTitle>
                        <Drumstick className="size-4 inline mr-2 stroke-sky-500" />
                        Nutrition Feedback
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <MarkdownRenderer content={data?.nutrition_feedback || ""} className="text-gray-800" />

                    <div className="grid grid-cols-2 gap-4 place-items-center">
                        <div className="w-full h-full flex flex-col justify-center gap-1 px-4 py-2 rounded-lg bg-sky-200/80 text-sm text-gray-800">
                            <p className="font-medium">Adherence</p>
                            <p>{formatValueWithBold(data?.nutrition_adherence)}</p>
                        </div>
                        <div className="w-full h-full flex flex-col justify-center gap-1 px-4 py-2 rounded-lg bg-sky-200/80 text-sm text-gray-800">
                            <p className="font-medium">Average Intake</p>
                            <p>{formatValueWithBold(data?.nutrition_intake)}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-semibold mb-2">Recommendations:</p>
                        <RecommendationsList content={data?.nutrition_recommendations} variant="sky" />
                    </div>
                </CardContent>
            </Card>

            <Card className="gap-2 bg-purple-100/60 shadow-none border-none">
                <CardHeader>
                    <CardTitle>
                        <Lightbulb className="size-4 inline mr-2 stroke-purple-500" />
                        Key Takeaways
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid auto-cols-[.5fr] grid-cols-1 gap-3">
                        {keyTakeaways.map((takeaway, index) => (
                            <div key={index} className="w-full h-full flex flex-col justify-center gap-1 px-4 py-2 rounded-lg bg-purple-200/80 text-sm text-gray-800">
                                <MarkdownRenderer content={takeaway} className="text-gray-800 text-sm" />
                            </div>

                        ))}
                    </div>
                </CardContent>
            </Card>

        </SubLayout>
    );
}