import { cn } from "@/lib/utils";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";

export const ReportCard = ({ number, date, description }) => {
    return (
        <Card className="gap-2 hover:shadow-lg transition-shadow">
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