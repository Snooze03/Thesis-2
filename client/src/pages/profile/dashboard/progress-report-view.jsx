import { useLocation, useNavigate } from "react-router-dom";
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

// Component for each report section
const FeedbackSection = ({ icon: Icon, title, bgColor, content, stats, recommendations, recommendationVariant }) => (
    <Card className={`gap-2 ${bgColor} shadow-none border-none`}>
        <CardHeader>
            <CardTitle>
                <Icon className={`size-4 inline mr-2 stroke-${recommendationVariant}-500`} />
                {title}
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <MarkdownRenderer content={content || ""} className="text-gray-800" />

            {stats && (
                <div className="grid grid-cols-2 gap-4 place-items-center">
                    {stats.map((stat, index) => (
                        <div key={index} className={`w-full h-full flex flex-col justify-center gap-1 px-4 py-2 rounded-lg bg-${recommendationVariant}-200/80 text-sm text-gray-800`}>
                            <p className="font-medium">{stat.label}</p>
                            <p>{formatValueWithBold(stat.value)}</p>
                        </div>
                    ))}
                </div>
            )}

            {recommendations && (
                <div>
                    <p className="text-sm font-semibold mb-2">Recommendations:</p>
                    <RecommendationsList content={recommendations} variant={recommendationVariant} />
                </div>
            )}
        </CardContent>
    </Card>
);

// Main view component 
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

    // Define sections configuration
    const sections = [
        {
            id: 'summary',
            icon: TrendingUp,
            title: 'Progress Summary',
            bgColor: 'bg-green-100/60',
            content: data?.progress_summary,
            recommendationVariant: 'green'
        },
        {
            id: 'workout',
            icon: Dumbbell,
            title: 'Workout Feedback',
            bgColor: 'bg-orange-100/60',
            content: data?.workout_feedback,
            stats: [
                { label: 'Current Frequency', value: data?.workout_frequency },
                { label: 'Average Duration', value: data?.workout_duration }
            ],
            recommendations: data?.workout_recommendations,
            recommendationVariant: 'orange'
        },
        {
            id: 'nutrition',
            icon: Drumstick,
            title: 'Nutrition Feedback',
            bgColor: 'bg-sky-100/60',
            content: data?.nutrition_feedback,
            stats: [
                { label: 'Adherence', value: data?.nutrition_adherence },
                { label: 'Average Intake', value: data?.nutrition_intake }
            ],
            recommendations: data?.nutrition_recommendations,
            recommendationVariant: 'sky'
        }
    ];

    console.log("Progress Report Details:", data);

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
                )}>
                    <Download strokeWidth="3" className="hover:stroke-white size-4" />
                    Export
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
                    bgColor={section.bgColor}
                    content={section.content}
                    stats={section.stats}
                    recommendations={section.recommendations}
                    recommendationVariant={section.recommendationVariant}
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