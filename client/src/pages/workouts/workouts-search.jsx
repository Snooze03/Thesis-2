"use client"

import { SubLayout } from "@/layouts/sub-layout";
import { X, Search, ListFilter, Check } from "lucide-react";
import { KebabMenu } from "@/components/ui/kebab-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clsx } from "clsx";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useNavigate } from "react-router";

function SearchExercise() {
    const navigate = useNavigate();

    const exercises = [
        { id: 1, name: "Push-ups", bodyPart: "Chest", equipment: "Bodyweight" },
        { id: 2, name: "Squats", bodyPart: "Legs", equipment: "Bodyweight" },
        { id: 3, name: "Bench Press", bodyPart: "Chest", equipment: "Barbell" },
    ];

    // Handles item selected state
    const [selectedItems, setSelectedItems] = useState(new Set());

    const toggleItemSelection = (itemId) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const hasSelectedItems = selectedItems.size > 0;

    return (
        <SubLayout>
            {/* Header */}
            <div className="grid grid-cols-[auto_1fr_auto_auto] grid-rows-2 items-center gap-2">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                >
                    <X />
                </Button>

                <h1 className="font-bold">Add Exercise</h1>
                <ListFilter />
                <KebabMenu />

                <div className="relative w-full block col-span-4">
                    <Input className="col-span-4 pl-10" placeholder="search for an exercise" />
                    <Search className={cn(
                        "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none",
                        // "max-2xs:size-4"
                    )} />
                </div>
            </div>

            {/* List items */}
            <div className="flex flex-col gap-2">
                {exercises.map(exercise => (
                    <ListItem
                        key={exercise.id}
                        id={exercise.id}
                        exercise={exercise}
                        isSelected={selectedItems.has(exercise.id)}
                        onToggle={() => toggleItemSelection(exercise.id)}
                    />
                ))}

            </div>

            {/* Conditional button - only shows when items are selected */}
            {hasSelectedItems && (
                <Button
                    variant="ghost"
                    className="h-10 fixed bottom-4 right-4 rounded-full bg-primary-500 text-white shadow-lg"
                >
                    <Check className="size-5 stroke-3" />
                </Button>
            )}
        </SubLayout>
    );
}

function ListItem({ id, exercise, isSelected, onToggle }) {
    return (
        <div
            className={clsx(
                "px-3 py-2 rounded-lg hover:bg-primary-100 hover:shadow-sm transition-all delay-20 duration-100 ease-in-out cursor-pointer",
                { "bg-primary-300 shadow-sm": isSelected }
            )}
            onClick={onToggle}
        >
            <div className="flex gap-2">
                <p>{exercise.name}</p>
                <p>({exercise.bodyPart})</p>
            </div>
            <p className="text-gray-600">{exercise.equipment}</p>
        </div>
    );
}

export { SearchExercise }