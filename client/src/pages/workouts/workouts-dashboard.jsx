"use client";

import api from "@/api";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/layouts/main-layout";
import { SectionTitle, SectionSubTitle, SectionSubText } from "@/components/ui/section-title";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Accordion } from "@/components/ui/accordion";
import { WorkoutTemplate } from "./workouts-template";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EmptyItems } from "@/components/empty-items";

const WorkoutsDashboard = () => {
    const navigate = useNavigate();

    // ===== GET ALL TEMPLATES =====
    const getTemplates = async () => {
        const response = await api.get("workouts/templates/");
        return response.data;
    };

    const {
        data: templates = [],
        isPending,
        isError,
    } = useQuery({
        queryKey: ["templates"],
        queryFn: getTemplates,
    });
    // ===== END GET =====

    // Separate into alternatives vs routines
    const routines = templates.filter((t) => !t.isAlternative);
    const alternatives = templates.filter((t) => t.isAlternative);

    return (
        <MainLayout>
            <SectionTitle>Workouts</SectionTitle>
            <SectionSubText>Organize your routines</SectionSubText>

            <Routines
                isPending={isPending}
                templates={routines}
                navigate={navigate}
            />

            <Alternatives
                isPending={isPending}
                templates={alternatives}
                navigate={navigate}
            />

            <WorkoutsHistory />
        </MainLayout>
    );
};

function Routines({ templates, isPending, navigate }) {
    return (
        <>
            <div className="flex justify-between items-center border-b-2 pb-3">
                <SectionSubTitle>My Routines</SectionSubTitle>
                <Button
                    className="h-min"
                    onClick={() =>
                        navigate(`${location.pathname}/templates/create`, { replace: true })
                    }
                >
                    <Plus />
                    Create
                </Button>
            </div>

            {isPending ? (
                <LoadingSpinner message="templates" />
            ) : templates.length > 0 ? (
                <Accordion type="single" collapsible className="space-y-3">
                    {templates.map((item) => (
                        <WorkoutTemplate key={item.id} id={item.id} title={item.title} />
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

function Alternatives({ templates, isPending, navigate }) {
    return (
        <>
            <div className="flex justify-between items-center border-b-2 pb-3">
                <SectionSubTitle>Alternative Routines</SectionSubTitle>
                <Button
                    className="h-min"
                    onClick={() =>
                        navigate(`${location.pathname}/templates/create`, { replace: true })
                    }
                >
                    <Plus />
                    Create
                </Button>
            </div>

            {isPending ? (
                <LoadingSpinner message="templates" />
            ) : templates.length > 0 ? (
                <Accordion type="single" collapsible className="space-y-3">
                    {templates.map((item) => (
                        <WorkoutTemplate key={item.id} id={item.id} title={item.title} />
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
