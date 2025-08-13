"use client"

import api from "@/api";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/layouts/main-layout";
import { SectionTitle, SectionSubTitle, SectionSubText } from "@/components/ui/section-title";
import { Accordion } from "@/components/ui/accordion";
import { WorkoutTemplate } from "./workouts-template";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";


const WorkoutsDashboard = () => {
    return (
        <MainLayout>
            <SectionTitle>Workouts</SectionTitle>
            <SectionSubText>Organize your routines</SectionSubText>

            <Routines />

            <Alternatives />
        </MainLayout>
    );
}

function Routines() {
    const navigate = useNavigate();
    const queryClient = useQueryClient(); // Add this line

    const getTemplates = async () => {
        const response = await api.get("workouts/templates/");
        return response.data;
    }

    const deleteTemplate = async (id) => {
        await api.delete(`workouts/templates/${id}/`);
    }

    // For fetching
    const { data, isPending, isError } = useQuery({
        queryKey: ["templates"],
        queryFn: getTemplates,
    });

    // For posts requests 
    const { mutate: deleteTemplateMutate, isLoading: isDeleting } = useMutation({
        mutationFn: deleteTemplate,
        onSuccess: () => {
            // Invalidate the templates query to refetch data
            queryClient.invalidateQueries({ queryKey: ["templates"] });
            alert("deleted");
        },
        onError: (error) => {
            alert(`Error deleting template: ${error.message}`);
        }
    });

    if (isPending) return <h1>Loading...</h1>
    if (isError) return <h1>Error</h1>

    return (
        <>
            <div className="flex justify-between items-center border-b-2 pb-3">
                <SectionSubTitle>My Routines</SectionSubTitle>
                <Button
                    className="h-min"
                    onClick={() => navigate(`${location.pathname}/create`)}
                >
                    <Plus />
                    Create
                </Button>
            </div>

            <Accordion type="single" collapsible className="space-y-3">
                {data.map(item => {
                    return (
                        <WorkoutTemplate
                            key={item.id}
                            id={item.id}
                            title={item.title}
                            onDelete={() => deleteTemplateMutate(item.id)}
                            isDeleting={isDeleting}
                        />
                    );
                })}
            </Accordion>
        </>
    );
}

function Alternatives() {
    return (
        <>
            <div className="flex justify-between items-center border-b-2 pb-3 mt-7">
                <SectionSubTitle>Alternatives</SectionSubTitle>
                <Button className="h-min">
                    <Plus />
                    Create
                </Button>
            </div>

            <Accordion type="single" collapsible className="space-y-3">
                {/* <WorkoutTemplate id="1" title="Push Day" workouts="2" />
                <WorkoutTemplate id="2" title="Pull Day" workouts="2" /> */}
            </Accordion>
        </>
    );
}

export { WorkoutsDashboard }