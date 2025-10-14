import { SectionSubTitle } from "@/components/ui/section-title";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EmptyItems } from "@/components/empty-items";

function DietPlan() {
    return (
        <div className="space-y-3">
            <div className="space-y-3">
                <div className="flex justify-between items-center border-b-2 pb-3">
                    <SectionSubTitle>Breakfast</SectionSubTitle>
                    <Button className="text-white h-min"><Plus /> Add</Button>
                </div>
                <EmptyItems />
            </div>
            <div className="space-y-3">
                <div className="flex justify-between items-center border-b-2 pb-3">
                    <SectionSubTitle>Lunch</SectionSubTitle>
                    <Button className="text-white h-min"><Plus /> Add</Button>
                </div>
                <EmptyItems />
            </div>
            <div className="space-y-3">
                <div className="flex justify-between items-center border-b-2 pb-3">
                    <SectionSubTitle>Dinner</SectionSubTitle>
                    <Button className="text-white h-min"><Plus /> Add</Button>
                </div>
                <EmptyItems />
            </div>
            <div className="space-y-3">
                <div className="flex justify-between items-center border-b-2 pb-3">
                    <SectionSubTitle>Snacks</SectionSubTitle>
                    <Button className="text-white h-min"><Plus /> Add</Button>
                </div>
                <EmptyItems />
            </div>
        </div>
    );
}

export { DietPlan }