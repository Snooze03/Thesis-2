import { useNavigate } from "react-router-dom";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import clsx from "clsx";

export const ReportCard = ({ data }) => {
    const navigate = useNavigate();

    // Report values
    const number = data.id;
    const date = data.period_display;
    const description = data.preview_text;
    const is_unread = !data.is_read;

    // console.log("Report Data:", data);

    const handleOpen = () => {
        navigate(`progress-report`, { state: { reportId: data.id } });
    }

    return (
        <Card className="gap-2 hover:shadow-lg transition-shadow" onClick={handleOpen}>
            <CardHeader>
                <div className={clsx(
                    { "flex flex-col justify-center gap-1": !is_unread },
                    { " grid grid-cols-[auto_min-content] grid-rows-2": is_unread }
                )}>
                    <CardTitle>Report #{number}</CardTitle>
                    {is_unread && (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100">
                            <Mail className="size-3 stroke-orange-400" />
                            <p className="text-orange-600 text-xs">New</p>
                        </div>
                    )}
                    <CardDescription className="max-xs:text-xs">{date}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="max-xs:text-sm">
                <p>{description}</p>
            </CardContent>
        </Card>
    );
}