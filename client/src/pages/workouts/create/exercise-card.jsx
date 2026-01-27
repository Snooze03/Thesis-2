import { React } from "react";
import { useState, useCallback, useEffect } from "react";
import { useAtom } from "jotai";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KebabMenu } from "@/components/ui/kebab-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, AlarmClock, Minus, Lock, Check, Weight, Triangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exerciseRestTimesAtom, restTimerAtom, exerciseWeightUnitsAtom } from "./template-atoms";
import { generateTimeOptions } from "../utils/generateTimeOptions";
import { DurationInput } from "./duration-input";
import { isSetComplete } from "../utils/set-helpers";
import { KG_TO_LBS, LBS_TO_KG } from "../constants";
import { toast } from "react-hot-toast";
import clsx from "clsx";


function ExerciseCard({ exercise, templateMode, onRemove, onUpdate }) {
    const canInputData = (templateMode === "start") ? false : true;
    const isStartMode = templateMode === "start";

    const [previousSetsData] = useState(exercise.previous_sets_data || []);
    const [suggestedSets] = useState(exercise.suggested_sets || []);
    const hasPreviousData = exercise.has_previous_data || false;

    // Local state for sets_data
    const [setsData, setSetsData] = useState(() => {
        // In start mode, use suggested sets if available
        if (isStartMode && suggestedSets.length > 0) {
            return suggestedSets;
        }
        // Otherwise use template sets_data
        return exercise.sets_data || [{ reps: null, weight: null }];
    });

    useEffect(() => {
        if (isStartMode && suggestedSets.length > 0) {
            onUpdate?.({ sets_data: suggestedSets });
        }
    }, []);

    const [completedSets, setCompletedSets] = useState(new Set());
    const [isRestTimerOpen, setIsRestTimerOpen] = useState(false);
    const [exerciseRestTimes, setExerciseRestTimes] = useAtom(exerciseRestTimesAtom);
    const [restTimer, setRestTimer] = useAtom(restTimerAtom);
    const [exerciseWeightUnits, setExerciseWeightUnits] = useAtom(exerciseWeightUnitsAtom);

    const exerciseKey = `${exercise.name}_${exercise.muscle || 'no_muscle'}`;
    const currentSetType = exercise.set_type || 'weight_reps';
    const currentRestTime = exerciseRestTimes.get(exerciseKey) || exercise.rest_time || null;
    const currentWeightUnit = exerciseWeightUnits.get(exerciseKey) || exercise.weight_unit || 'kg';

    // Generate time options from 0:05 to 6:00 in 5-second intervals
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

    // Handle weight unit change with conversion
    const handleWeightUnitChange = useCallback((newUnit) => {
        // If already in target unit, do nothing
        if (currentWeightUnit === newUnit) {
            return;
        }

        // Convert all weights in sets_data
        const convertedSetsData = setsData.map((set, index) => {
            // Skip conversion if weight is null, empty, or 0
            if (set.weight === null || set.weight === '' || set.weight === 0) {
                return set;
            }

            const weight = parseFloat(set.weight);

            // Skip if weight is not a valid number
            if (isNaN(weight)) {
                return set;
            }

            const convertedWeight = newUnit === 'lbs'
                ? (weight * KG_TO_LBS).toFixed(2)
                : (weight * LBS_TO_KG).toFixed(2);


            return {
                ...set,
                weight: parseFloat(convertedWeight)
            };
        });

        // Update local state
        setSetsData(convertedSetsData);

        // Update weight units atom
        setExerciseWeightUnits(prev => {
            const newMap = new Map(prev);
            newMap.set(exerciseKey, newUnit);
            return newMap;
        });

        // Update parent component
        onUpdate?.({
            sets_data: convertedSetsData,
            weight_unit: newUnit
        });
    }, [currentWeightUnit, setsData, exerciseKey, setExerciseWeightUnits, onUpdate]);

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

    const formatPreviousSet = useCallback((previousSet, index) => {
        if (!previousSet) return "---";

        switch (currentSetType) {
            case 'weight_reps':
                const weight = previousSet.weight ?? '?';
                const reps = previousSet.reps ?? '?';
                return `${weight}${currentWeightUnit} × ${reps}`;

            case 'reps_only':
                return `${previousSet.reps ?? '?'} reps`;

            case 'duration':
                return previousSet.duration ?? '00:00';

            default:
                return "---";
        }
    }, [currentSetType, currentWeightUnit]);

    const handleRestTimer = () => {
        setIsRestTimerOpen(true);
    };

    const handleRemoveExercise = () => {
        onRemove?.();
    };

    const handleSetChange = useCallback((setIndex, field, value) => {
        const newSetsData = [...setsData];

        // Handle different field types
        let parsedValue;

        if (field === 'duration') {
            // Validate duration (max 30 minutes = 30:00)
            if (value && value !== '') {
                const [minutes, seconds] = value.split(':').map(num => parseInt(num) || 0);
                const totalMinutes = minutes + (seconds / 60);

                if (totalMinutes > 30) {
                    toast.error("Duration cannot exceed 30 minutes. Please enter a realistic value.");
                    return; // Don't update state
                }
            }
            parsedValue = value; // Keep as string for duration
        } else {
            parsedValue = value === '' ? null : (field === 'weight' ? parseFloat(value) : parseInt(value));

            // Validate reps (max 100)
            if (field === 'reps' && parsedValue !== null && parsedValue > 100) {
                toast.error("Reps cannot exceed 100. Please enter a realistic value.");
                return; // Don't update state
            }

            // Validate weight (max 250kg or 550lbs)
            if (field === 'weight' && parsedValue !== null) {
                const maxWeight = currentWeightUnit === 'kg' ? 250 : 550;
                const unitLabel = currentWeightUnit === 'kg' ? 'kg' : 'lbs';

                if (parsedValue > maxWeight) {
                    toast.error(`Weight cannot exceed ${maxWeight}${unitLabel}. Please enter a realistic value.`);
                    return; // Don't update state
                }
            }
        }

        newSetsData[setIndex] = {
            ...newSetsData[setIndex],
            [field]: parsedValue
        };
        setSetsData(newSetsData);

        // Check if the set is now incomplete after the change
        const updatedSet = newSetsData[setIndex];
        const isIncomplete = !isSetComplete(updatedSet, currentSetType);

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
    }, [setsData, currentSetType, currentWeightUnit, onUpdate]);

    const handleCompletedSet = useCallback((setIndex) => {
        const currentSet = setsData[setIndex];

        // Check if set is complete based on set type
        if (!isSetComplete(currentSet, currentSetType)) {
            return;
        }

        setCompletedSets(prev => {
            const newCompletedSets = new Set(prev);
            if (newCompletedSets.has(setIndex)) {
                newCompletedSets.delete(setIndex);
            } else {
                newCompletedSets.add(setIndex);
            }
            return newCompletedSets;
        });

        if (isStartMode && currentRestTime && currentRestTime > 0) {
            setTimeout(() => {
                setRestTimer({
                    isActive: true,
                    remainingSeconds: currentRestTime,
                    exerciseName: exercise.name,
                    exerciseMuscle: exercise.muscle,
                    totalSeconds: currentRestTime
                });
            }, 0);
        }
    }, [setsData, currentSetType, isStartMode, currentRestTime, exercise.name, exercise.muscle, setRestTimer]);

    const renderSetInputs = (set, index) => {
        const isCompleted = completedSets.has(index);
        const suggestedSet = suggestedSets[index];

        switch (currentSetType) {
            case 'weight_reps':
                return (
                    <>
                        <Input
                            className="size-5 w-full px-2 text-center"
                            type="number"
                            step="0.5"
                            disabled={canInputData}
                            placeholder={suggestedSet?.weight ? `${suggestedSet.weight}` : "0"}
                            value={set.weight || ''}
                            onChange={(e) => handleSetChange(index, 'weight', e.target.value)}
                        />
                        <Input
                            className="size-5 w-full px-2 text-center"
                            type="number"
                            step="0.5"
                            disabled={canInputData}
                            placeholder={suggestedSet?.reps ? `${suggestedSet.reps}` : "0"}
                            value={set.reps || ''}
                            onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                        />
                    </>
                );

            case 'reps_only':
                return (
                    <>
                        <Input
                            className="size-5 w-full col-span-2 px-2 text-center"
                            type="number"
                            step="0.5"
                            disabled={canInputData}
                            placeholder={suggestedSet?.reps ? `${suggestedSet.reps}` : "0"}
                            value={set.reps || ''}
                            onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                        />
                    </>
                );

            case 'duration':
                return (
                    <div className="col-span-2">
                        <DurationInput
                            value={set.duration ?? ''}
                            onChange={(value) => handleSetChange(index, 'duration', value)}
                            disabled={canInputData || isCompleted}
                            placeholder={suggestedSet?.duration || "00:00"}
                            className="w-full"
                        />
                    </div>
                );

            default:
                return null;
        }
    };

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
            {
                icon: Weight,
                label: "Weight Unit",
                submenu: [
                    {
                        label: "Kilograms (kg)",
                        action: () => handleWeightUnitChange('kg'),
                        icon: currentWeightUnit === 'kg' ? Check : null,
                    },
                    {
                        label: "Pounds (lbs)",
                        action: () => handleWeightUnitChange('lbs'),
                        icon: currentWeightUnit === 'lbs' ? Check : null,
                    },
                ]
            },
            {
                icon: Triangle,
                label: "Set Type",
                submenu: [
                    {
                        label: "Reps",
                        action: () => currentSetType !== 'reps_only' && onUpdate?.({ set_type: 'reps_only' }),
                        icon: currentSetType === 'reps_only' ? Check : null,
                    },
                    {
                        label: "Reps & Weights",
                        action: () => currentSetType !== 'weight_reps' && onUpdate?.({ set_type: 'weight_reps' }),
                        icon: currentSetType === 'weight_reps' ? Check : null,
                    },
                    {
                        label: "Duration",
                        action: () => currentSetType !== 'duration' && onUpdate?.({ set_type: 'duration' }),
                        icon: currentSetType === 'duration' ? Check : null,
                    },
                ]
            },
        ];

        if (isStartMode) {
            // In start mode, show all items including weight unit
            return baseItems;
        }

        // In edit/create mode, show all actions including remove
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
                        {currentSetType === 'weight_reps' && (
                            <>
                                <p className="text-sm text-gray-600">Weight ({currentWeightUnit})</p>
                                <p className="text-sm text-gray-600">Reps</p>
                            </>
                        )}
                        {currentSetType === 'reps_only' && (
                            <p className="text-sm text-gray-600 col-span-2">Reps</p>
                        )}
                        {currentSetType === 'duration' && (
                            <p className="text-sm text-gray-600 col-span-2">Duration (MM:SS)</p>
                        )}
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
                                <p className="text-gray-600 text-xs">
                                    {hasPreviousData && previousSetsData[index]
                                        ? formatPreviousSet(previousSetsData[index], index)
                                        : "---"
                                    }
                                </p>
                                {renderSetInputs(set, index)}
                                {canInputData ? (
                                    <Lock className="text-gray-600 size-4" />
                                ) : (
                                    <Button
                                        className={clsx(
                                            "w-7 h-5 py-1",
                                            {
                                                "bg-green-500 hover:bg-green-600": isCompleted,
                                                "hover:bg-green-50": !isCompleted && isSetComplete(set, currentSetType),
                                                "opacity-50 cursor-not-allowed": !isSetComplete(set, currentSetType),
                                            }
                                        )}
                                        variant={isCompleted ? "default" : "ghost"}
                                        disabled={!isSetComplete(set, currentSetType)}
                                        onClick={() => handleCompletedSet(index)}
                                    >
                                        <Check
                                            className={clsx(
                                                "size-4",
                                                {
                                                    "stroke-white": isCompleted,
                                                    "stroke-green-400": !isCompleted && isSetComplete(set, currentSetType),
                                                    "stroke-gray-400": !isSetComplete(set, currentSetType),
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