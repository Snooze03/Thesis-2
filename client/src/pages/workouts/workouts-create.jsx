"use client"

import { useNavigate } from "react-router-dom";
import { X, FlagTriangleRight, Lock, Plus, Trash2, Replace, AlarmClock, Minus } from "lucide-react";
import { SubLayout } from "@/layouts/sub-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KebabMenu } from "@/components/ui/kebab-menu";
import { Input } from "@/components/ui/input";

// Main function
function CreateTemplate() {
    const navigate = useNavigate();

    return (
        <SubLayout>
            {/* Header */}
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                <Button
                    variant="ghost"
                    className="h-7"
                    onClick={() => navigate(-1)}
                >
                    <X />
                </Button>

                <Input variant="ghost" placeholder="New Workout Template" className="h-7"></Input>

                <Button className="h-7 ml-3">
                    <FlagTriangleRight />
                    Save
                </Button>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-3">
                <ExerciseCard />
                <ExerciseCard />
                <Button
                    variant="ghost"
                    className="text-primary font-semibold"
                    onClick={() => navigate(`${location.pathname}/search`)}
                >
                    ADD EXERCISE
                </Button>
            </div>
        </SubLayout>
    );
}

function PropertyContainer({ children }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2">
            {children}
            {/* Adds additional space below */}
            <span className="block" />
        </div>
    )
}

function ExerciseCard() {
    const menuItems = [
        { type: "title", label: "My Account" },
        { icon: Plus, label: "Add Set", action: "add_set" },
        { icon: Trash2, label: "Delete Set", action: "delete_set" },
        { icon: AlarmClock, label: "Rest Timer", action: "set_restTimer" },
        { icon: Replace, label: "Replace Exercise", action: "change_exercise" },
        { icon: Minus, label: "Remove Exercise", variant: "destructive", action: "change_exercise" },
    ]

    return (
        <Card className="px-5 py-3 gap-2">
            {/* Header */}
            <div>
                <div className="flex justify-between items-center gap-3">
                    <p className="font-semibold">Bench Press</p>
                    <KebabMenu items={menuItems} />
                </div>
                <p className="-mt-2 text-gray-600">Barbell</p>
            </div>

            {/* Properties */}
            <div className="grid grid-flow-col auto-cols-auto gap-3">
                <PropertyContainer>
                    <p>Sets</p>
                    <p className="text-primary font-semibold">1</p>
                    <p className="text-primary font-semibold">2</p>
                </PropertyContainer>

                <PropertyContainer>
                    <p>Previous</p>
                    <p className="text-gray-600 ">30kg x 10</p>
                    <p className="text-gray-600 ">30kg x 10</p>
                </PropertyContainer>

                <PropertyContainer>
                    <p>Weight</p>
                    <Input className="size-5 w-full px-2 text-center" />
                    <Input className="size-5 w-full px-2" />
                </PropertyContainer>

                <PropertyContainer>
                    <p>Reps</p>
                    <Input className="size-5 w-full px-2" />
                    <Input className="size-5 w-full px-2" />
                </PropertyContainer>

                <PropertyContainer>
                    <br />
                    <Lock className="text-gray-600 size-4" />
                    <Lock className="text-gray-600 size-4" />
                </PropertyContainer>
            </div>

        </Card>
    );
}

export { CreateTemplate }