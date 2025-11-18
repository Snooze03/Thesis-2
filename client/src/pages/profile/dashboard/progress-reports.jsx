import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { formatDate } from "@/utils/formatDate";

export const ReportCard = ({ data }) => {
    const navigate = useNavigate();

    // Report values
    const number = data.id;
    const date = data.period_display;
    const description = data.preview_text;

    const handleOpen = () => {
        navigate(`progress-report`, { state: { reportId: data.id } });
    }

    return (
        <Card className="gap-2 hover:shadow-lg transition-shadow" onClick={handleOpen}>
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