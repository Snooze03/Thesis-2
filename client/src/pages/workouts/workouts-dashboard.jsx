"use client"

import { MainLayout } from "@/layouts/main-layout";
import { SectionTitle, SectionSubTitle, SectionSubText } from "@/components/ui/section-title";
import { Accordion } from "@/components/ui/accordion";
import { WorkoutTemplate } from "./workouts-template";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { useNavigate } from "react-router-dom";


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

    return (
        <>
            <div className="flex justify-between items-center border-b-2 pb-3">
                <SectionSubTitle>My Routines</SectionSubTitle>
                <Button className="h-min" onClick={() => navigate(`${location.pathname}create`)}>
                    <Plus />
                    Create
                </Button>
            </div>

            <Accordion type="single" collapsible className="space-y-3">
                <WorkoutTemplate id="1" title="Push Day" workouts="2" />
                <WorkoutTemplate id="2" title="Pull Day" workouts="2" />
                <WorkoutTemplate id="3" title="Leg Day" workouts="2" />
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
                <WorkoutTemplate id="1" title="Push Day" workouts="2" />
                <WorkoutTemplate id="2" title="Pull Day" workouts="2" />
            </Accordion>
        </>
    );
}

export { WorkoutsDashboard } 