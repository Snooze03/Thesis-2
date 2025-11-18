import { useLocation, useNavigate } from "react-router-dom";
import { fetchProgressReportDetails } from "@/hooks/assistant/useProgressReport";
import { SubLayout } from "@/layouts/sub-layout";
import { ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/section-title";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

// Reusable Report Section Component
const ReportSection = ({ title, content, bgColor }) => (
    <Card className="pt-0">
        <CardHeader className={`${bgColor} pt-6 pb-4 rounded-t-lg`}>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <p>{content}</p>
        </CardContent>
    </Card>
);

export function ProgressReportView() {
    const location = useLocation();
    const navigate = useNavigate();
    const reportId = location.state?.reportId;

    const {
        progressReportDetails,
        isLoading,
        isError
    } = fetchProgressReportDetails(reportId);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (isError) {
        return <div>Error loading report</div>;
    }

    // Define sections configuration
    const reportSections = [
        {
            id: 'summary',
            title: 'Progress Summary',
            content: progressReportDetails?.progress_summary,
            bgColor: 'bg-green-200'
        },
        {
            id: 'workout',
            title: 'Workout Feedback',
            content: progressReportDetails?.workout_feedback,
            bgColor: 'bg-orange-200'
        },
        {
            id: 'nutrition',
            title: 'Nutrition Feedback',
            content: progressReportDetails?.nutrition_feedback,
            bgColor: 'bg-purple-200'
        },
        {
            id: 'takeaways',
            title: 'Key Takeaways',
            content: progressReportDetails?.key_takeaways,
            bgColor: 'bg-sky-200'
        }
    ];

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
                    <p className="text-gray-700">{progressReportDetails?.period_display}</p>
                </div>
            </Card>

            {/* Loop over sections */}
            {reportSections.map((section) => (
                <ReportSection
                    key={section.id}
                    title={section.title}
                    content={section.content}
                    bgColor={section.bgColor}
                />
            ))}
        </SubLayout>
    );
}