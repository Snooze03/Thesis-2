import { React } from "react";
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KebabMenu } from "@/components/ui/kebab-menu";
import { Plus, Trash2, AlarmClock, Replace, Minus, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import toast from "react-hot-toast";

function ExerciseCard({
    exercise,
    templateMode,
    onRemove,
    onUpdate
}) {
    const navigate = useNavigate();
    const canInputData = (templateMode === "start") ? false : true;
    const isStartMode = templateMode === "start";

    // Local state for sets_data
    const [setsData, setSetsData] = useState(
        exercise.sets_data || [
            { reps: null, weight: null },
        ]
    );

    // State to track completed sets (index-based)
    const [completedSets, setCompletedSets] = useState(new Set());

    // ===== EVENT HANDLERS =====
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

            // Update completed sets - remove the last set if it was completed
            const lastSetIndex = setsData.length - 1;
            setCompletedSets(prev => {
                const newCompletedSets = new Set(prev);
                newCompletedSets.delete(lastSetIndex);
                // Shift down all sets with index greater than the deleted one
                const updatedSets = new Set();
                newCompletedSets.forEach(index => {
                    if (index < lastSetIndex) {
                        updatedSets.add(index);
                    }
                });
                return updatedSets;
            });

            // Call onUpdate immediately when sets change
            onUpdate?.({ sets_data: newSetsData });
        }
    }, [setsData, onUpdate]);

    const handleRestTimer = () => {
        console.log("Rest timer functionality coming soon");
    };

    const handleReplace = () => {
        navigate("/workouts/templates");
    };

    const handleRemoveExercise = () => {
        onRemove?.();
    };

    const handleSetChange = useCallback((setIndex, field, value) => {
        const newSetsData = [...setsData];
        newSetsData[setIndex] = {
            ...newSetsData[setIndex],
            [field]: value === '' ? null : (field === 'weight' ? parseFloat(value) : parseInt(value))
        };
        setSetsData(newSetsData);

        // Check if the set is now incomplete after the change
        const updatedSet = newSetsData[setIndex];
        const isIncomplete = updatedSet.reps === null || updatedSet.reps === '' ||
            updatedSet.weight === null || updatedSet.weight === '';

        // If set becomes incomplete, remove it from completed sets
        if (isIncomplete) {
            setCompletedSets(prev => {
                const newCompletedSets = new Set(prev);
                newCompletedSets.delete(setIndex);
                return newCompletedSets;
            });
        }

        // Call onUpdate immediately when individual set changes
        onUpdate?.({ sets_data: newSetsData });
    }, [setsData, onUpdate]);

    const handleCompletedSet = useCallback((setIndex) => {
        const currentSet = setsData[setIndex];

        // Check if both reps and weight are filled
        const hasCompleteData = currentSet.reps !== null && currentSet.reps !== '' &&
            currentSet.weight !== null && currentSet.weight !== '';

        if (!hasCompleteData) {
            toast.error("Please fill in both reps and weight before marking this set as complete.");
            return;
        }

        setCompletedSets(prev => {
            const newCompletedSets = new Set(prev);
            if (newCompletedSets.has(setIndex)) {
                // If already completed, remove it (toggle off)
                newCompletedSets.delete(setIndex);
            } else {
                // If not completed, add it (toggle on)
                newCompletedSets.add(setIndex);
            }
            return newCompletedSets;
        });
    }, [setsData]);

    // Filter menu items based on mode
    const getMenuItems = () => {
        const baseItems = [
            {
                icon: Plus,
                label: "Add Set",
                action: handleAddSet,
            },
            {
                icon: Trash2,
                label: "Delete Set",
                variant: "destructive",
                action: handleDeleteSet,
                disabled: setsData.length <= 1
            },
            {
                icon: AlarmClock,
                label: "Rest Timer",
                action: handleRestTimer
            },
        ];

        if (isStartMode) {
            // In start mode, only show basic actions
            return baseItems;
        }

        // In edit/create mode, show all actions
        return [
            ...baseItems,
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
    };

    return (
        <Card className="px-6 py-5 gap-2">
            {/* Header */}
            <div>
                <div className="flex justify-between items-start gap-3 mb-1">
                    <div className="flex-1 ">
                        <p className="font-semibold leading-tight">
                            {exercise.name}
                            <span className="ml-2 font-normal text-gray-600 capitalize">
                                ({exercise.muscle || 'Unknown muscle'})
                            </span>
                        </p>
                        <p className="text-gray-600 text-sm mt-0.5">{exercise.equipment || 'No equipment'}</p>
                    </div>
                    <KebabMenu
                        items={getMenuItems()}
                        className="flex-shrink-0"
                    />
                </div>
            </div>

            {/* Sets Container - Headers and Data in one grid */}
            <div className="space-y-2">
                {/* Properties Header */}
                <div className="grid grid-cols-[.16fr_.4fr_.5fr_.5fr_auto] gap-3 place-items-center">
                    <p className="text-sm text-gray-600">Sets</p>
                    <p className="text-sm text-gray-600">Previous</p>
                    <p className="text-sm text-gray-600">Weight</p>
                    <p className="text-sm text-gray-600">Reps</p>
                    <div className={clsx("w-4", { "w-7": isStartMode })}></div> {/* Spacer for button column */}
                </div>

                {/* Sets Data */}
                {setsData.map((set, index) => {
                    const isCompleted = completedSets.has(index);

                    return (
                        <div
                            className={clsx(
                                "grid grid-cols-[.16fr_.4fr_.5fr_.5fr_auto] gap-3 place-items-center",
                                {
                                    "bg-green-50 py-1 rounded-md": isStartMode && isCompleted,
                                }
                            )}
                            key={index}
                        >
                            <p className="text-primary font-semibold">{index + 1}</p>
                            <p className="text-gray-600">----------</p>
                            <Input
                                className="size-5 w-full px-2 text-center"
                                type="number"
                                step="0.5"
                                disabled={canInputData}
                                placeholder="0"
                                value={set.weight || ''}
                                onChange={(e) => handleSetChange(index, 'weight', e.target.value)}
                            />
                            <Input
                                className="size-5 w-full px-2 text-center"
                                type="number"
                                disabled={canInputData}
                                placeholder="0"
                                value={set.reps || ''}
                                onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                            />
                            {canInputData ? (
                                <Lock className="text-gray-600 size-4" />
                            ) : (
                                <Button
                                    className={clsx(
                                        "w-7 h-5 py-1",
                                        {
                                            "bg-green-500 hover:bg-green-600": isCompleted,
                                            "hover:bg-green-50": !isCompleted && (set.reps !== null && set.reps !== '' && set.weight !== null && set.weight !== ''),
                                            "opacity-50 cursor-not-allowed": !(set.reps !== null && set.reps !== '' && set.weight !== null && set.weight !== ''),
                                        }
                                    )}
                                    variant={isCompleted ? "default" : "ghost"}
                                    disabled={!(set.reps !== null && set.reps !== '' && set.weight !== null && set.weight !== '')}
                                    onClick={() => handleCompletedSet(index)}
                                >
                                    <Check
                                        className={clsx(
                                            "size-4",
                                            {
                                                "stroke-white": isCompleted,
                                                "stroke-green-400": !isCompleted && (set.reps !== null && set.reps !== '' && set.weight !== null && set.weight !== ''),
                                                "stroke-gray-400": !(set.reps !== null && set.reps !== '' && set.weight !== null && set.weight !== ''),
                                            }
                                        )}
                                    />
                                </Button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Progress indicator for start mode only */}
            {isStartMode && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                            Progress: {completedSets.size}/{setsData.length} sets
                        </span>
                        <div className="flex gap-1">
                            {setsData.map((_, index) => (
                                <div
                                    key={index}
                                    className={clsx(
                                        "w-2 h-2 rounded-full",
                                        {
                                            "bg-green-500": completedSets.has(index),
                                            "bg-gray-300": !completedSets.has(index),
                                        }
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}

export { ExerciseCard };