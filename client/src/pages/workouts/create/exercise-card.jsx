"use client"

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KebabMenu } from "@/components/ui/kebab-menu";
import { Plus, Trash2, AlarmClock, Replace, Minus, Lock } from "lucide-react";
import * as v from "valibot";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useTemplateExercises } from "@/hooks/workouts/useTemplateExercises";

function ExerciseCard({
    template_exercise,
    isEditing,
}) {
    const navigate = useNavigate();

    // Variables to easily refer to certain properties
    const template_id = template_exercise.template;
    const template_exercise_id = template_exercise.exercise.id;
    const exercise = template_exercise.exercise;
    const sets = [...Array(template_exercise.sets).keys()];

    const {
        removeExercise,
        updateSets,
        isRemoving,
        isUpdating,
    } = useTemplateExercises(template_id);

    // Hook Form and valibot validation for weights and reps input
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: valibotResolver(ExerciseSchema)
    });

    // ===== EVENT HANDLERS =====
    const handleRemoveExercise = () => {
        if (window.confirm("Are you sure you want to remove this exercise?")) {
            removeExercise({
                templateId: template_id,
                exerciseId: template_exercise_id,
            });
        }
    };

    const handleAddSet = () => {
        updateSets({
            template_exercise_ID: template_exercise.id,
            newSet: template_exercise.sets + 1,
        });
    };

    const handleDeleteSet = () => {
        updateSets({
            template_exercise_ID: template_exercise.id,
            newSet: template_exercise.sets - 1,
        });
    };

    const handleReplace = () => {
        // Get the template object from location state or construct it
        const templateData = {
            id: template_id,
        };

        // Navigate to search with template state
        navigate("/workouts/templates/search", {
            state: {
                template: templateData,
                mode: "search"
            }
        });
    };

    const handleRestTimer = () => {
        // Placeholder for rest timer functionality
        console.log("Rest timer functionality coming soon");
    };

    const menuItems = [
        {
            icon: Plus,
            label: "Add Set",
            action: handleAddSet,
            disabled: isUpdating
        },
        {
            icon: Trash2,
            label: "Delete Set",
            action: handleDeleteSet,
            disabled: template_exercise.sets <= 1 || isUpdating
        },
        {
            icon: AlarmClock,
            label: "Rest Timer",
            action: handleRestTimer
        },
        {
            icon: Replace,
            label: "Replace Exercise",
            action: handleReplace,
            disabled: isRemoving
        },
        {
            icon: Minus,
            label: "Remove Exercise",
            variant: "destructive",
            action: handleRemoveExercise,
            disabled: isRemoving
        },
    ];

    return (
        <Card className="px-5 py-3 gap-2">
            {/* Header */}
            <div>
                <div className="flex justify-between items-center gap-3">
                    <p className="font-semibold">
                        {exercise.name}
                        <span className="font-normal text-gray-600 ml-2 capitalize">
                            ({exercise.muscle})
                        </span>
                    </p>
                    <KebabMenu
                        items={menuItems}
                        disabled={isRemoving || isUpdating}
                    />
                </div>
                <p className="-mt-2 text-gray-600">{exercise.equipment}</p>
            </div>

            {/* Properties */}
            <div className="grid grid-cols-[.2fr_auto_.5fr_.5fr] items-start">
                <p>Sets</p>
                <p>Previous</p>
                <p className="justify-self-center ml-2">Weight</p>
                <p className="justify-self-center mr-6">Reps</p>
            </div>

            {/* Sets */}
            {sets.map((_, index) => {
                index++;
                return (
                    <div className="grid grid-cols-[.2fr_auto_.5fr_.5fr_auto] gap-3 place-items-center" key={index}>
                        <p className="text-primary font-semibold">{index}</p>
                        <p className="text-gray-600">30kg x 10</p>
                        <Input
                            id={`weight_${index}`}
                            {...register(`weight_${index}`)}
                            className="size-5 w-full px-2 text-center"
                            type="number"
                            step="0.5"
                            disabled={!isEditing}
                            placeholder="0"
                        />
                        <Input
                            id={`rep_${index}`}
                            {...register(`repetitions_${index}`)}
                            className="size-5 w-full px-2 text-center"
                            type="number"
                            disabled={!isEditing}
                            placeholder="0"
                        />
                        {!isEditing ? (
                            <Lock className="text-gray-600 size-4" />
                        ) : (
                            <div className="size-4" /> // Empty space to maintain layout
                        )}
                    </div>
                );
            })}
            <span />
        </Card>
    );
}

const ExerciseSchema = v.object({
    weight: v.pipe(
        v.string(),
        v.nonEmpty("Weight is empty"),
        v.transform(Number),
        v.number("Enter a valid number"),
    ),
    repetitions: v.pipe(
        v.string(),
        v.nonEmpty("Reps is empty"),
        v.transform(Number),
        v.number("Enter a valid number"),
    )
});

export { ExerciseCard }