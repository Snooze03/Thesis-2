import { MainLayout } from "@/layouts/main-layout";
import { useNavigate } from "react-router-dom";
import { useTemplates } from "@/hooks/workouts/templates/useTemplates";
import { useTemplateActions } from "@/hooks/workouts/templates/useTemplateActions";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useAtom } from "jotai";
import { templateModeAtom } from "../create/template-atoms";
import { SectionTitle, SectionSubTitle, SectionSubText } from "@/components/ui/section-title";
import { Accordion } from "@/components/ui/accordion";
import { TemplateItem } from "./template-item";
import { HistoryItem } from "./history-item";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EmptyItems } from "@/components/empty-items";
import { Skeleton } from "@/components/ui/skeleton";

export const WorkoutsDashboard = () => {
    const navigate = useNavigate();
    const [templateMode, setTemplateMode] = useAtom(templateModeAtom);

    const {
        routines,
        alternatives,
        isLoading,
    } = useTemplates();

    useScrollLock(isLoading);

    const handleCreateTemplate = (is_alternative = false) => {
        setTemplateMode("create");
        navigate("/workouts/templates", {
            state: {
                isAlternative: is_alternative,
            }
        });
    }

    return (
        <MainLayout>
            <SectionTitle>Workouts</SectionTitle>
            <SectionSubText>Organize your routines</SectionSubText>

            <TemplatesList
                title="My Routines"
                templates={routines}
                isLoading={isLoading}
                onCreateClick={() => handleCreateTemplate(false)}
            />

            <TemplatesList
                title="Alternative Routines"
                templates={alternatives}
                isLoading={isLoading}
                onCreateClick={() => handleCreateTemplate(true)}
            />

            <WorkoutsHistory />
        </MainLayout>
    );
};

function TemplatesList({ title, templates, isLoading, onCreateClick }) {
    return (
        <>
            <div className="flex justify-between items-center border-b-2 pb-3">
                <SectionSubTitle>{title}</SectionSubTitle>
                <Button
                    className="h-min"
                    onClick={onCreateClick}
                >
                    <Plus />
                    Create
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, index) => (
                        <Skeleton key={index} className="h-12 w-full rounded-md" />
                    ))}
                </div>
            ) : templates.length > 0 ? (
                <Accordion type="single" collapsible className="space-y-3">
                    {templates.map((item) => (
                        <TemplateItem key={item.id} templateData={item} />
                    ))}
                </Accordion>
            ) : (
                <EmptyItems
                    title="No templates added yet"
                    description="Click 'Create' to make one"
                />
            )}
        </>
    );
}


function WorkoutsHistory() {
    const {
        workoutHistory,
        isFetchingHistory
    } = useTemplateActions();

    if (isFetchingHistory) {
        return (
            <div className="mt-7">
                <SectionSubTitle className="border-b-2 pb-3">
                    History
                </SectionSubTitle>
                <div className="space-y-3 mt-3">
                    {[...Array(3)].map((_, index) => (
                        <Skeleton key={index} className="h-20 w-full rounded-md" />
                    ))}
                </div>
            </div>
        )
    }

    const hasWorkouts = workoutHistory && workoutHistory.length > 0;

    return (
        <div className="mt-7">
            <SectionSubTitle className="border-b-2 pb-3">
                History ({hasWorkouts ? workoutHistory.length : 0})
            </SectionSubTitle>

            {hasWorkouts ? (
                <div className="space-y-3 mt-4">
                    {workoutHistory.map((workout) => (
                        <HistoryItem key={workout.id} workout={workout} />
                    ))}
                </div>
            ) : (
                <EmptyItems
                    title="No workouts done"
                    description="Perform any workouts from routines or alternatives"
                />
            )}
        </div>
    );
}