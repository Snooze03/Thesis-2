import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useExportReport } from "@/hooks/assistant/useExportReport";
import { fetchProgressReportDetails } from "@/hooks/assistant/useProgressReport";
import { SubLayout } from "@/layouts/sub-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/section-title";
import { Calendar, ArrowLeft, TrendingUp, Dumbbell, Drumstick, Lightbulb, Download } from "lucide-react";
import { formatValueWithBold } from "../utils/formatValueWithBold";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { RecommendationsList } from "../utils/recommendationLists";
import { parseBulletList } from "../utils/parseBulletLists";
import { cn } from "@/lib/utils";


// Main view component 
export function ProgressReportView() {
    const location = useLocation();
    const navigate = useNavigate();
    const reportId = location.state?.reportId;
    const [exporting, setExporting] = useState(false);

    const {
        data,
        isLoading,
        isError
    } = fetchProgressReportDetails(reportId);

    const {
        exportReport,
        isLoading: isExporting,
        isError: isExportError
    } = useExportReport(reportId);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (isError) {
        return <div>Error loading report</div>;
    }

    // Parse key takeaways into array
    const keyTakeaways = parseBulletList(data?.key_takeaways);

    const handleExport = () => {
        setExporting(true);
        exportReport(reportId);
        setExporting(false);
    }

    // Define sections configuration
    const sections = [
        {
            id: 'summary',
            icon: TrendingUp,
            title: 'Progress Summary',
            variant: 'green',
            content: data?.progress_summary,
        },
        {
            id: 'workout',
            icon: Dumbbell,
            title: 'Workout Feedback',
            variant: 'orange',
            content: data?.workout_feedback,
            stats: [
                { label: 'Current Frequency', value: data?.workout_frequency },
                { label: 'Average Duration', value: data?.workout_duration }
            ],
            recommendations: data?.workout_recommendations,
        },
        {
            id: 'nutrition',
            icon: Drumstick,
            title: 'Nutrition Feedback',
            variant: 'sky',
            content: data?.nutrition_feedback,
            stats: [
                { label: 'Adherence', value: data?.nutrition_adherence },
                { label: 'Average Intake', value: data?.nutrition_intake }
            ],
            recommendations: data?.nutrition_recommendations,
        }
    ];

    return (
        <SubLayout>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => navigate(-1, { replace: true })}>
                        <ArrowLeft className="size-4" />
                    </Button>
                    <SectionTitle>Report #{reportId}</SectionTitle>
                </div>
                <button className={cn(
                    "flex items-center gap-2 px-4 py-1 text-sm border-2 border-primary rounded-md text-primary font-semibold cursor-pointer",
                    "hover:bg-primary hover:text-white transition delay-50 duration-200 ease-in-out ",
                    "max-xs:px-2",
                )} onClick={handleExport} disabled={exporting || isExporting}>
                    <Download strokeWidth="3" className="hover:stroke-white size-4" />
                    {exporting ? "Exporting..." : "Export PDF"}
                </button>
            </div>

            <Card className="flex place-items-center py-2 px-4 shadow-xs">
                <div className="flex flex-row items-center justify-between gap-2 font-semibold">
                    <Calendar className="inline size-4 text-gray-500" />
                    <p className="text-gray-700">{data?.period_display}</p>
                </div>
            </Card>

            {/* Render all sections */}
            {sections.map((section) => (
                <FeedbackSection
                    key={section.id}
                    icon={section.icon}
                    title={section.title}
                    variant={section.variant}
                    content={section.content}
                    stats={section.stats}
                    recommendations={section.recommendations}
                />
            ))}

            {/* Key Takeaways */}
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

// Component for each report section
const FeedbackSection = ({ icon: Icon, title, variant = "green", content, stats, recommendations }) => {
    return (
        <Card
            className={cn(
                "gap-2 shadow-none border-none",
                variant === "green" && "bg-green-100/60",
                variant === "orange" && "bg-orange-100/60",
                variant === "sky" && "bg-sky-100/60"
            )}
        >
            <CardHeader>
                <CardTitle>
                    <Icon
                        className={cn(
                            "size-4 inline mr-2",
                            variant === "green" && "stroke-green-500",
                            variant === "orange" && "stroke-orange-500",
                            variant === "sky" && "stroke-sky-500"
                        )}
                    />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <MarkdownRenderer content={content || ""} className="text-gray-800" />

                {stats && (
                    <div className="grid grid-cols-2 gap-4 place-items-center">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "w-full h-full flex flex-col justify-center gap-1 px-4 py-2 rounded-lg text-sm text-gray-800",
                                    variant === "green" && "bg-green-200/80",
                                    variant === "orange" && "bg-orange-200/80",
                                    variant === "sky" && "bg-sky-200/80"
                                )}
                            >
                                <p className="font-medium">{stat.label}</p>
                                <p>{formatValueWithBold(stat.value)}</p>
                            </div>
                        ))}
                    </div>
                )}

                {recommendations && (
                    <div>
                        <p className="text-sm font-semibold mb-2">Recommendations:</p>
                        <RecommendationsList content={recommendations} variant={variant} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
};