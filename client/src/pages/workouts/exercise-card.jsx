"use client"

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KebabMenu } from "@/components/ui/kebab-menu";
import { Plus, Trash2, AlarmClock, Replace, Minus, Lock } from "lucide-react";
import * as v from "valibot";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Item } from "@radix-ui/react-accordion";
import { Key } from "lucide-react";


function ExerciseCard({
    template_exercise,
    isEditing,
}) {
    const [isDone, setIsDone] = useState(false);
    const queryClient = useQueryClient();

    // Variables to easily refer to certain properties
    const template_id = template_exercise.template;
    const template_exercise_id = template_exercise.exercise.id;
    const exercise = template_exercise.exercise;
    const sets = [...Array(template_exercise.sets).keys()]

    // Hook Form and valibot validation for weights and reps input
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: valibotResolver(ExerciseSchema)
    });

    // ===== REMOVE EXERCISE FROM TEMPLATE =====
    const removeExerciseFromTemplate = async ({ templateId, exerciseId }) => {
        const response = await api.delete(`workouts/templates/${templateId}/remove_exercise/`, {
            data: { exercise_id: exerciseId }
        });
        return response.data;
    };

    const {
        mutate: removeExercise,
        isLoading: isRemoving
    } = useMutation({
        mutationFn: removeExerciseFromTemplate,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["template_exercises"] }) // invalidate to refetch exercise data
        },
        onError: (error) => {
            toast.error(`Error removing exercise: ${error.response?.data?.error || error.message}`);
        }
    });
    // ===== END REMOVE EXERCISE =====

    // ===== EVENT HANDLERS =====
    const handleRemoveExercise = () => {
        removeExercise({
            templateId: template_id,
            exerciseId: template_exercise_id,
        });
    };


    const menuItems = [
        { icon: Plus, label: "Add Set", action: "add_set" },
        { icon: Trash2, label: "Delete Set", action: "delete_set" },
        { icon: AlarmClock, label: "Rest Timer", action: "set_restTimer" },
        { icon: Replace, label: "Replace Exercise", action: "change_exercise" },
        { icon: Minus, label: "Remove Exercise", variant: "destructive", action: handleRemoveExercise },
    ]

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
                    <KebabMenu items={menuItems} />
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
            {sets.map((_, index) => {
                index++;
                return (
                    <div className="grid grid-cols-[.2fr_auto_.5fr_.5fr_auto] gap-3 place-items-center" key={index}>
                        <p className="text-primary font-semibold">{index}</p>
                        <p className="text-gray-600 ">30kg x 10</p>
                        <Input
                            id={`weight_${1}`}
                            {...register("weight")}
                            className="size-5 w-full px-2 text-center"
                            type="number"
                            disabled={isEditing}
                        />
                        <Input
                            id={`rep_${1}`}
                            {...register("repetitions")}
                            className="size-5 w-full px-2 text-center"
                            type="number"
                            disabled={isEditing}
                        />
                        {isEditing ? <Lock className="text-gray-600 size-4" /> : <p>Not Eidting</p>}

                    </div>
                );
            })}
            <span />

        </Card>
    );
}

// Container for sets, weight etc
function PropertyContainer({ children }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2">
            {children}
            {/* Adds additional space below */}
            <span className="block" />
        </div>
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
})

export { ExerciseCard }