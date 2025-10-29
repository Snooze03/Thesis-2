import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KebabMenu } from "@/components/ui/kebab-menu";
import { Plus, Trash2, AlarmClock, Replace, Minus, Lock } from "lucide-react";
import * as v from "valibot";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function ExerciseCard({
    exercise,
    isEditing = true,
    onRemove,
    onUpdate
}) {
    const navigate = useNavigate();

    // Local state for exercise parameters (use props values as defaults)
    const [sets, setSets] = useState(exercise.sets || 3);

    // Create array for rendering sets
    const setsArray = [...Array(sets).keys()];

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
            onRemove?.();
        }
    };

    const handleAddSet = () => {
        const newSets = sets + 1;
        setSets(newSets);
        // Update the exercise in the atom
        onUpdate?.({ sets: newSets });
    };

    const handleDeleteSet = () => {
        if (sets > 1) {
            const newSets = sets - 1;
            setSets(newSets);
            // Update the exercise in the atom
            onUpdate?.({ sets: newSets });
        }
    };

    const handleReplace = () => {
        // Navigate to search to replace this exercise
        navigate("/workouts/templates/create/search");
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
        },
        {
            icon: Trash2,
            label: "Delete Set",
            action: handleDeleteSet,
            disabled: sets <= 1
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
        },
        {
            icon: Minus,
            label: "Remove Exercise",
            variant: "destructive",
            action: handleRemoveExercise,
        },
    ];

    return (
        <Card className="px-5 py-3 gap-2">
            {/* Header */}
            <div>
                <div className="flex justify-between items-start gap-3 mb-1">
                    <div className="flex-1">
                        <p className="font-semibold leading-tight">
                            {exercise.name}
                            <span className="font-normal text-gray-600 ml-2 capitalize">
                                ({exercise.muscle || 'Unknown muscle'})
                            </span>
                        </p>
                        <p className="text-gray-600 text-sm mt-0.5">{exercise.equipment || 'No equipment'}</p>
                    </div>
                    <KebabMenu
                        items={menuItems}
                        className="flex-shrink-0"
                    />
                </div>
            </div>

            {/* Properties */}
            <div className="grid grid-cols-[.2fr_auto_.5fr_.5fr] items-start">
                <p>Sets</p>
                <p>Previous</p>
                <p className="justify-self-center ml-2">Weight</p>
                <p className="justify-self-center mr-6">Reps</p>
            </div>

            {/* Sets */}
            {setsArray.map((_, index) => {
                index++;
                return (
                    <div className="grid grid-cols-[.2fr_auto_.5fr_.5fr_auto] gap-3 place-items-center" key={index}>
                        <p className="text-primary font-semibold">{index}</p>
                        <p className="text-gray-600">-</p>
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

export { ExerciseCard };
