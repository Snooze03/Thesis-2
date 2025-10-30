import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KebabMenu } from "@/components/ui/kebab-menu";
import { Plus, Trash2, AlarmClock, Replace, Minus, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";

function ExerciseCard({
    exercise,
    isEditing = true,
    onRemove,
    onUpdate
}) {
    const navigate = useNavigate();

    // Local state for sets_data
    const [setsData, setSetsData] = useState(
        exercise.sets_data || [
            { reps: null, weight: null },
        ]
    );

    // ===== EVENT HANDLERS =====
    const handleRemoveExercise = () => {
        onRemove?.();
    };

    const handleAddSet = useCallback(() => {
        const newSetsData = [...setsData, { reps: null, weight: null }];
        setSetsData(newSetsData);
        // Call onUpdate immediately when sets change
        onUpdate?.({ sets_data: newSetsData });
    }, [setsData, onUpdate]);

    const handleDeleteSet = useCallback(() => {
        if (setsData.length > 1) {
            const newSetsData = setsData.slice(0, -1);
            setSetsData(newSetsData);
            // Call onUpdate immediately when sets change
            onUpdate?.({ sets_data: newSetsData });
        }
    }, [setsData, onUpdate]);

    const handleReplace = () => {
        navigate("/workouts/templates/create/search");
    };

    const handleRestTimer = () => {
        console.log("Rest timer functionality coming soon");
    };

    const handleSetChange = useCallback((setIndex, field, value) => {
        const newSetsData = [...setsData];
        newSetsData[setIndex] = {
            ...newSetsData[setIndex],
            [field]: value === '' ? null : (field === 'weight' ? parseFloat(value) : parseInt(value))
        };
        setSetsData(newSetsData);
        // Call onUpdate immediately when individual set changes
        onUpdate?.({ sets_data: newSetsData });
    }, [setsData, onUpdate]);

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
            disabled: setsData.length <= 1
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
            {setsData.map((set, index) => (
                <div className="grid grid-cols-[.2fr_auto_.5fr_.5fr_auto] gap-3 place-items-center" key={index}>
                    <p className="text-primary font-semibold">{index + 1}</p>
                    <p className="text-gray-600">-</p>
                    <Input
                        className="size-5 w-full px-2 text-center"
                        type="number"
                        step="0.5"
                        disabled={!isEditing}
                        placeholder="0"
                        value={set.weight || ''}
                        onChange={(e) => handleSetChange(index, 'weight', e.target.value)}
                    />
                    <Input
                        className="size-5 w-full px-2 text-center"
                        type="number"
                        disabled={!isEditing}
                        placeholder="0"
                        value={set.reps || ''}
                        onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                    />
                    {!isEditing ? (
                        <Lock className="text-gray-600 size-4" />
                    ) : (
                        <div className="size-4" />
                    )}
                </div>
            ))}
            <span />
        </Card>
    );
}

export { ExerciseCard };