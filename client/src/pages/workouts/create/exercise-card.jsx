import { React } from "react";
import { useState, useCallback, useEffect } from "react";
import { useAtom } from "jotai";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KebabMenu } from "@/components/ui/kebab-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, AlarmClock, Minus, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exerciseRestTimesAtom } from "./template-atoms";
import clsx from "clsx";
import toast from "react-hot-toast";

function ExerciseCard({
    exercise,
    templateMode,
    onRemove,
    onUpdate
}) {
    const canInputData = (templateMode === "start") ? false : true;
    const isStartMode = templateMode === "start";

    // Local state for sets_data
    const [setsData, setSetsData] = useState(
        exercise.sets_data || [
            { reps: null, weight: null },
        ]
    );

    const [completedSets, setCompletedSets] = useState(new Set());
    const [isRestTimerOpen, setIsRestTimerOpen] = useState(false);
    const [exerciseRestTimes, setExerciseRestTimes] = useAtom(exerciseRestTimesAtom);
    const exerciseKey = `${exercise.name}_${exercise.muscle || 'no_muscle'}`;
    const currentRestTime = exerciseRestTimes.get(exerciseKey) || exercise.rest_time || null;

    // Generate time options from 0:05 to 6:00 in 5-second intervals
    const generateTimeOptions = () => {
        const options = [];
        // Start from 5 seconds (0:05) up to 6 minutes (6:00)
        for (let seconds = 5; seconds <= 360; seconds += 5) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            const display = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
            options.push({ value: seconds, display });
        }
        return options;
    };

    const timeOptions = generateTimeOptions();

    // Handle rest time selection
    const handleRestTimeSelect = useCallback((timeInSeconds) => {
        setExerciseRestTimes(prev => {
            const newMap = new Map(prev);
            newMap.set(exerciseKey, timeInSeconds);
            return newMap;
        });

        // Update the exercise data
        onUpdate?.({ rest_time: timeInSeconds });

        setIsRestTimerOpen(false);
    }, [exerciseKey, setExerciseRestTimes, onUpdate]);

    // Effect to scroll to selected time when dialog opens
    useEffect(() => {
        if (isRestTimerOpen && currentRestTime) {
            setTimeout(() => {
                const selectedButton = document.querySelector(`[data-time-value="${currentRestTime}"]`);
                if (selectedButton) {
                    selectedButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }, [isRestTimerOpen, currentRestTime]);

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
        setIsRestTimerOpen(true);
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
                icon: Minus,
                label: "Remove Exercise",
                variant: "destructive",
                action: handleRemoveExercise,
            },
        ];
    };

    return (
        <>
            <Card className="px-6 py-5 gap-2">
                {/* Header */}
                <div>
                    <div className="flex justify-between items-start gap-3 ">
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
                        <div className={clsx("w-4", { "w-7": isStartMode })}></div>
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

            {/* Rest Timer Selection Dialog */}
            <Dialog open={isRestTimerOpen} onOpenChange={setIsRestTimerOpen}>
                <DialogContent className="w-2xs">
                    <DialogHeader className="gap-0">
                        <DialogTitle className="flex justify-between items-center text-base">
                            Set Rest Timer
                        </DialogTitle>
                        <DialogDescription>
                            {currentRestTime
                                ? `Current: ${Math.floor(currentRestTime / 60)}:${(currentRestTime % 60).toString().padStart(2, '0')}`
                                : 'Select a rest time for this exercise'
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2">
                        <ScrollArea className="h-48 w-full">
                            <div className="space-y-0 px-1">
                                {timeOptions.map((option) => {
                                    const isSelected = currentRestTime === option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            data-time-value={option.value}
                                            onClick={() => handleRestTimeSelect(option.value)}
                                            className={clsx(
                                                "w-full text-center px-3 py-2.5 transition-all font-medium rounded-md",
                                                {
                                                    "bg-primary text-white": isSelected,
                                                    "hover:bg-gray-100 text-gray-700": !isSelected,
                                                }
                                            )}
                                        >
                                            {option.display}
                                        </button>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

export { ExerciseCard };