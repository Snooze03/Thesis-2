import { MainLayout } from "@/layouts/main-layout";
import { useNavigate } from "react-router-dom";
import { useTemplates } from "@/hooks/workouts/templates/useTemplates";
import { useScrollLock } from "@/hooks/useScrollLock";
import { SectionTitle, SectionSubTitle, SectionSubText } from "@/components/ui/section-title";
import { Accordion } from "@/components/ui/accordion";
import { TemplateItem } from "./template-item";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EmptyItems } from "@/components/empty-items";
import { Skeleton } from "@/components/ui/skeleton";

const WorkoutsDashboard = () => {
    const navigate = useNavigate();

    const {
        routines,
        alternatives,
        isLoading,
    } = useTemplates();

    useScrollLock(isLoading);

    const handleCreateTemplate = (is_alternative = false) => {
        navigate("/workouts/templates/create", {
            state: {
                isAlternative: is_alternative,
                mode: "create"
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
                isPending={isLoading}
                onCreateClick={() => handleCreateTemplate(false)}
            />

            <TemplatesList
                title="Alternative Routines"
                templates={alternatives}
                isPending={isLoading}
                onCreateClick={() => handleCreateTemplate(true)}
            />

            <WorkoutsHistory />
        </MainLayout>
    );
};

function TemplatesList({ title, templates, isPending, onCreateClick }) {
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

            {isPending ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, index) => (
                        <Skeleton key={index} className="h-12 w-full rounded-md" />
                    ))}
                </div>
            ) : templates.length > 0 ? (
                <Accordion type="single" collapsible className="space-y-3">
                    {templates.map((item) => (
                        <TemplateItem key={item.id} id={item.id} title={item.title} />
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
    return (
        <>
            <SectionSubTitle className="border-b-2 pb-3 mt-7">
                History
            </SectionSubTitle>
            <EmptyItems
                title="No workouts done"
                description="perform any workouts from routines or alternatives"
            />
        </>
    );
}

export { WorkoutsDashboard };