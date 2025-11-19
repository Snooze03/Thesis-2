import { useLocation, useNavigate } from "react-router-dom";
import { fetchProgressReportDetails } from "@/hooks/assistant/useProgressReport";
import { SubLayout } from "@/layouts/sub-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/section-title";
import { ChevronLeft, ChevronRight, Calendar, ArrowLeft, TrendingUp, Dumbbell, Drumstick, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { MarkdownRenderer } from "@/components/markdown-renderer";


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
            <Card className="gap-2">
                <CardHeader >
                    <CardTitle>
                        <TrendingUp className="size-4 inline mr-2 stroke-purple-500" />
                        Progress Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ReactMarkdown>{data?.progress_summary}</ReactMarkdown>
                </CardContent>
            </Card>

            {/* Workout Feedback */}
            <Card className="gap-2">
                <CardHeader>
                    <CardTitle>
                        <Dumbbell className="size-4 inline mr-2 stroke-orange-500" />
                        Workout Feedback
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <MarkdownRenderer content={data?.workout_feedback || ""} />

                    <div className="grid grid-cols-2 gap-4 place-items-center">
                        <div className="w-full h-full flex flex-col justify-center gap-1 px-4 py-2 rounded-lg shadow-lg bg-gray-100 text-sm">
                            <p className="font-medium">Current Frequency</p>
                            <p>{data?.workout_frequency}</p>
                        </div>
                        <div className="w-full h-full flex flex-col justify-center gap-1 px-4 py-2 rounded-lg shadow-lg bg-gray-100 text-sm">
                            <p className="font-medium">Average Duration</p>
                            <p>{data?.workout_duration}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-semibold mb-2">Recommendations:</p>
                        <MarkdownRenderer content={data?.workout_recommendations || ""} />
                    </div>
                </CardContent>
            </Card>

            {/* Nutrition Feedback */}
            <Card className="gap-2">
                <CardHeader>
                    <CardTitle>
                        <Drumstick className="size-4 inline mr-2 stroke-sky-500" />
                        Nutrition Feedback
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <MarkdownRenderer content={data?.nutrition_feedback || ""} />

                    <div className="flex gap-4 place-items-center">
                        <div className="px-4 py-2 rounded-lg shadow-lg bg-gray-100 text-sm">
                            <p className="font-medium mb-1">Adherence</p>
                            <p>{data?.nutrition_adherence}</p>
                        </div>
                        <div className="px-4 py-2 rounded-lg shadow-lg bg-gray-100 text-sm">
                            <p className="font-medium mb-1">Avg Intake</p>
                            <p>{data?.nutrition_intake}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-semibold mb-2">Recommendations:</p>
                        <MarkdownRenderer content={data?.nutrition_recommendations || ""} />
                    </div>
                </CardContent>
            </Card>

            <Card className="gap-2">
                <CardHeader>
                    <CardTitle>
                        <Drumstick className="size-4 inline mr-2 stroke-sky-500" />
                        Key Takeaways
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <MarkdownRenderer content={data?.key_takeaways || ""} />
                </CardContent>
            </Card>


        </SubLayout>
    );
}