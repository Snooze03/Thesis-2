import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTemplates } from "@/hooks/workouts/templates/useTemplates";
import { useTemplateActions } from "@/hooks/workouts/templates/useTemplateActions";
import { useAtom, useAtomValue } from "jotai";
import { templateTitleAtom, templateIdAtom, isAlternativeAtom, selectedExercisesAtom, templateModeAtom, startedAtAtom, completedAtAtom, exerciseRestTimesAtom, restTimerAtom, exerciseWeightUnitsAtom } from "./template-atoms";
import { X, FlagTriangleRight, Plus } from "lucide-react";
import { SubLayout } from "@/layouts/sub-layout";
import { ExerciseCard } from "./exercise-card";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { RestTimerDialog } from "../dialogs/rest-timer";
import { CancelWorkoutDialog } from "../dialogs/cancel-workout";
import { EmptyItems } from "@/components/empty-items";
import toast from "react-hot-toast";
import clsx from "clsx";

// Component for Creating/Editing/Starting a workout routine
export function WorkoutsTemplate() {
    const location = useLocation();
    const navigate = useNavigate();

    // Nav states
    const template_data = location.state?.templateObj || null;

    // ===== ATOMS =====
    const [title, setTitle] = useAtom(templateTitleAtom);
    const [selectedExercises, setSelectedExercises] = useAtom(selectedExercisesAtom);
    const [isAlternative, setIsAlternative] = useAtom(isAlternativeAtom);
    const [templateMode, setTemplateMode] = useAtom(templateModeAtom);
    const [template_id, setTemplate_id] = useAtom(templateIdAtom);
    // Workout timing atoms
    const [started_at, setStarted_at] = useAtom(startedAtAtom);
    const [completed_at, setCompleted_at] = useAtom(completedAtAtom);
    // Rest time atom
    const [exerciseRestTimes, setExerciseRestTimes] = useAtom(exerciseRestTimesAtom);
    // Rest timer countdown atom - READ ONLY 
    const restTimer = useAtomValue(restTimerAtom);
    // Weight units atom
    const [exerciseWeightUnits, setExerciseWeightUnits] = useAtom(exerciseWeightUnitsAtom);
    // Rest dialog state
    const [isRestDialogOpen, setIsRestDialogOpen] = useState(false);
    // ===== END ATOMS =====

    // Mode Selection
    const isEditMode = templateMode === "edit";
    const isCreateMode = templateMode === "create";
    const isStartMode = templateMode === "start";

    // Track if we've already populated the atoms to prevent re-population
    const hasPopulatedAtoms = useRef(false);

    // Convert Map to Array for easier rendering
    const exercisesArray = Array.from(selectedExercises.values());
    const hasExercises = exercisesArray.length > 0;
    const canSave = title.trim().length > 0 && hasExercises;

    // ===== HOOKS =====
    const {
        createTemplate,
        isCreating,
        updateTemplate,
        isUpdating,
    } = useTemplates();

    const {
        saveTemplate,
        isSaving,
    } = useTemplateActions();
    // ===== END HOOKS =====

    // ===== EFFECTS =====
    useEffect(() => {
        // Set workout start time when starting a workout
        if (isStartMode && !started_at) {
            const startTime = new Date().toISOString();
            setStarted_at(startTime);
        }
    }, [isStartMode, started_at, setStarted_at]);

    // Populate atoms with template data when editing (only once)
    useEffect(() => {
        if ((isEditMode || isStartMode) && template_data && !hasPopulatedAtoms.current) {
            // Set id
            setTemplate_id(template_data.id || null);
            // Set the title
            setTitle(template_data.title || '');

            // Convert template exercises to the format expected by selectedExercises atom
            const exercisesMap = new Map();
            const restTimesMap = new Map();
            const weightUnitsMap = new Map();

            if (template_data.template_exercises && template_data.template_exercises.length > 0) {
                template_data.template_exercises.forEach((templateExercise) => {
                    const exercise = templateExercise.exercise;

                    // Create the exercise key (same format used in search)
                    const exerciseKey = `${exercise.name}_${exercise.muscle || 'no_muscle'}`;

                    // Convert rest_time from HH:MM:SS to seconds if it exists
                    let restTimeInSeconds = null;
                    if (templateExercise.rest_time) {
                        const [hours, minutes, seconds] = templateExercise.rest_time.split(':').map(Number);
                        restTimeInSeconds = hours * 3600 + minutes * 60 + seconds;
                        restTimesMap.set(exerciseKey, restTimeInSeconds);
                    }

                    // Extract weight_unit from template exercise (default to 'kg' if not present)
                    const weightUnit = templateExercise.weight_unit || 'kg';
                    weightUnitsMap.set(exerciseKey, weightUnit);

                    // Create the exercise object with all necessary data
                    const exerciseData = {
                        // Exercise basic info
                        name: exercise.name,
                        type: exercise.type || '',
                        muscle: exercise.muscle || '',
                        equipment: exercise.equipment || '',
                        difficulty: exercise.difficulty || '',
                        instructions: exercise.instructions || '',

                        // Template exercise specific data
                        sets_data: templateExercise.sets_data || [
                            { reps: null, weight: null }
                        ],
                        weight_unit: weightUnit,
                        rest_time: restTimeInSeconds,
                        notes: templateExercise.notes || '',

                        // Additional metadata for editing/starting - CRUCIAL FOR UPDATES
                        template_exercise_id: templateExercise.id,
                        order: templateExercise.order || 0,
                    };

                    exercisesMap.set(exerciseKey, exerciseData);
                });
            }

            setSelectedExercises(exercisesMap);
            setExerciseRestTimes(restTimesMap);
            setExerciseWeightUnits(weightUnitsMap);
            hasPopulatedAtoms.current = true;
        }
    }, [isEditMode, isStartMode, template_data, setTitle, setSelectedExercises, setTemplate_id, setExerciseRestTimes, setExerciseWeightUnits]);
    // ===== END EFFECTS =====

    // Utility function to clear all atoms
    const clearAtoms = useCallback(() => {
        setTitle('');
        setIsAlternative(false);
        setSelectedExercises(new Map());
        setTemplate_id(null);
        setTemplateMode("create");
        setStarted_at(null);
        setCompleted_at(null);
        setExerciseRestTimes(new Map());
        setExerciseWeightUnits(new Map());
        setIsRestDialogOpen(false);
        hasPopulatedAtoms.current = false;
    }, [setTitle, setSelectedExercises, setTemplate_id, setTemplateMode, setStarted_at, setCompleted_at, setExerciseRestTimes, setExerciseWeightUnits, setIsAlternative]);

    // ===== EVENT HANDLERS =====
    const handleAddExercise = () => {
        // Navigate to search but maintain the navigation state
        navigate("search", {
            state: location.state // Pass through the current state
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Template creation/editing data structure
        const templateData = {
            title: title.trim(),
            isAlternative: isAlternative,
            exercises: exercisesArray.map(exercise => {
                // Generate exercise key to get rest time and weight unit
                const exerciseKey = `${exercise.name}_${exercise.muscle || 'no_muscle'}`;
                const restTime = exerciseRestTimes.get(exerciseKey) || exercise.rest_time;
                const weightUnit = exerciseWeightUnits.get(exerciseKey) || exercise.weight_unit || 'kg';

                return {
                    // Include template_exercise_id for existing exercises in edit mode
                    ...(isEditMode && exercise.template_exercise_id && {
                        template_exercise_id: exercise.template_exercise_id
                    }),

                    name: exercise.name,
                    type: exercise.type || '',
                    muscle: exercise.muscle || '',
                    equipment: exercise.equipment || '',
                    difficulty: exercise.difficulty || '',
                    instructions: exercise.instructions || '',
                    sets_data: exercise.sets_data || [
                        { reps: null, weight: null },
                    ],
                    weight_unit: weightUnit,
                    rest_time: restTime,
                    notes: exercise.notes || '',
                    order: exercise.order || 0
                };
            })
        };

        if (isEditMode) {
            updateTemplate({
                templateId: template_id,
                templateData,
            }, {
                onSuccess: (data) => {
                    clearAtoms();
                    navigate("/workouts");
                },
                onError: (error) => {
                    console.error('Update failed:', error);
                }
            });
        } else if (isCreateMode) {
            createTemplate(templateData, {
                onSuccess: () => {
                    clearAtoms();
                    navigate("/workouts");
                },
                onError: (error) => {
                    console.error('Create failed:', error);
                }
            });
        }
    };

    const handleFinishWorkout = () => {
        // Set completion time when finishing workout
        const completedTime = new Date().toISOString();
        setCompleted_at(completedTime);

        // Filter exercises with completed sets
        const completedExercises = exercisesArray
            .map((exercise, index) => {
                const completedSets = exercise.sets_data.filter(set =>
                    set.reps !== null && set.reps !== '' &&
                    set.weight !== null && set.weight !== ''
                );

                if (completedSets.length === 0) return null;

                const exerciseKey = `${exercise.name}_${exercise.muscle || 'no_muscle'}`;
                const weightUnit = exerciseWeightUnits.get(exerciseKey) || exercise.weight_unit || 'kg';

                return {
                    exercise_name: exercise.name,
                    performed_sets_data: completedSets,
                    weight_unit: weightUnit,
                    exercise_notes: exercise.notes || '',
                    order: exercise.order ?? index
                };
            })
            .filter(Boolean); // Remove null entries

        // Validate that at least one exercise was completed
        if (completedExercises.length === 0) {
            toast.error("No completed sets found. Please complete at least one set before finishing your workout.");
            return;
        }

        // Prepare raw workout data 
        const workoutData = {
            template_id: template_id,
            template_title: title,
            started_at: started_at,
            completed_at: completedTime,
            workout_notes: "notes",
            completed_exercises: completedExercises
        };

        // Save the completed workout
        saveTemplate({
            templateData: workoutData
        }, {
            onSuccess: () => {
                clearAtoms();
                navigate("/workouts");
            },
            onError: (error) => {
                clearAtoms();
                console.error('Save workout failed:', error);
            }
        });
    };

    const handleCancel = () => {
        // Clear atoms and navigate back
        clearAtoms();
        navigate("/workouts", { replace: true });
    };

    // Memoize these functions to prevent recreating on every render
    const handleRemoveExercise = useCallback((exerciseKey) => {
        setSelectedExercises(prev => {
            const newMap = new Map(prev);
            newMap.delete(exerciseKey);
            return newMap;
        });
    }, [setSelectedExercises]);

    const handleUpdateExercise = useCallback((exerciseKey, updates) => {
        setSelectedExercises(prev => {
            const newMap = new Map(prev);
            const exercise = newMap.get(exerciseKey);
            if (exercise) {
                newMap.set(exerciseKey, { ...exercise, ...updates });
            }
            return newMap;
        });

        // If weight_unit is being updated, also update the weight units atom
        if (updates.weight_unit) {
            setExerciseWeightUnits(prev => {
                const newMap = new Map(prev);
                newMap.set(exerciseKey, updates.weight_unit);
                return newMap;
            });
        }
    }, [setSelectedExercises, setExerciseWeightUnits]);

    const handleTitleChange = (e) => {
        setTitle(e.target.value);
    };

    const handleCancelWorkout = () => {
        clearAtoms();
        navigate("/workouts", { replace: true });
    }
    // ===== END EVENT HANDLERS =====

    // Determine UI text based on mode
    const pageTitle = isStartMode ? "Workout Session" : (isEditMode ? "Edit Template" : "Create Template");
    const buttonText = isStartMode ? (isSaving ? "Finishing..." : "Finish Workout") :
        (isEditMode ? (isUpdating ? "Updating..." : "Update") :
            (isCreating ? "Saving..." : "Save"));
    const cancelText = isStartMode ? "Cancel Workout Session?" :
        (isEditMode ? "Cancel Template Editing?" : "Cancel Template Creation?");

    // Calculate workout duration for display
    const workoutDuration = started_at ?
        Math.floor((new Date() - new Date(started_at)) / 1000 / 60) : 0;

    // Main View
    return (
        <SubLayout>
            {/* Header */}
            <div className={clsx(
                "grid items-center gap-2",
                { "grid-cols-[2fr_auto]": isStartMode, "grid-cols-[auto_1fr]": !isStartMode },
            )}>
                {/* Alert Dialog for closing/cancelling */}
                {(isCreateMode || isEditMode) && (
                    <AlertDialog>
                        <AlertDialogTrigger>
                            <X />
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    {cancelText}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    {isStartMode ?
                                        "Are you sure you want to cancel this workout? Your progress will be lost." :
                                        "Are you absolutely sure? Any unsaved changes will be lost."
                                    }
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleCancel}
                                    className={buttonVariants({ variant: "destructive" })}
                                >
                                    Continue
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-[1fr_auto] gap-2">
                    {/* Template title input */}
                    <Input
                        type="text"
                        id="template_title"
                        value={title}
                        onChange={handleTitleChange}
                        variant="ghost"
                        className="h-7 border-b-gray-700"
                        placeholder={isStartMode ? "Workout session..." : "Enter template title..."}
                        disabled={isCreating || isUpdating || isSaving || isStartMode}
                    />

                    {isStartMode ? (
                        // Finish Workout Confirmation Dialog
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    className="h-7 ml-3"
                                    disabled={isCreating || !canSave || isUpdating || isSaving}
                                    onClick={(e) => {
                                        // Check if user has completed at least one set across all exercises
                                        const hasAtLeastOneCompletedSet = exercisesArray.some(exercise =>
                                            exercise.sets_data.some(set =>
                                                set.reps !== null && set.reps !== '' &&
                                                set.weight !== null && set.weight !== ''
                                            )
                                        );

                                        if (!hasAtLeastOneCompletedSet) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toast.error("Please complete at least one set before finishing your workout.");
                                            return;
                                        }
                                    }}
                                >
                                    <FlagTriangleRight />
                                    {isSaving ? "Finishing..." : "Finish Workout"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Finish Workout Session?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you ready to finish your workout? This will save your progress and end the current session.
                                    </AlertDialogDescription>
                                    {/* Show summary of what will be saved */}
                                    <div className="mt-2 text-sm text-gray-600">
                                        {(() => {
                                            const completedExercises = exercisesArray.filter(exercise =>
                                                exercise.sets_data.some(set =>
                                                    set.reps !== null && set.reps !== '' &&
                                                    set.weight !== null && set.weight !== ''
                                                )
                                            );
                                            const totalCompletedSets = completedExercises.reduce((total, exercise) =>
                                                total + exercise.sets_data.filter(set =>
                                                    set.reps !== null && set.reps !== '' &&
                                                    set.weight !== null && set.weight !== ''
                                                ).length, 0
                                            );

                                            return `${completedExercises.length} exercises with ${totalCompletedSets} completed sets will be saved.`;
                                        })()}
                                    </div>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Continue Workout</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleFinishWorkout}
                                        className={buttonVariants({ variant: "default" })}
                                    >
                                        Finish Workout
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ) : (
                        // Regular Submit Button for create/edit modes
                        <Button
                            type="submit"
                            className="h-7 ml-3"
                            disabled={isCreating || !canSave || isUpdating || isSaving}
                        >
                            <FlagTriangleRight />
                            {buttonText}
                        </Button>
                    )}
                </form>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-3">
                {/* Show exercises */}
                {hasExercises ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-sm text-gray-700">
                                Exercises ({exercisesArray.length})
                            </h3>

                            {/* Rest timer dialog - only show when timer is active */}
                            {isStartMode && restTimer.isActive && (
                                <RestTimerDialog
                                    isOpen={isRestDialogOpen}
                                    onOpenChange={setIsRestDialogOpen}
                                />
                            )}
                        </div>
                        <div className="space-y-4">
                            {exercisesArray.map((exercise, index) => {
                                const exerciseKey = `${exercise.name}_${exercise.muscle || 'no_muscle'}`;
                                return (
                                    <div key={exerciseKey} className="relative group">
                                        <ExerciseCard
                                            exercise={exercise}
                                            templateMode={templateMode}
                                            onRemove={() => handleRemoveExercise(exerciseKey)}
                                            onUpdate={(updates) => handleUpdateExercise(exerciseKey, updates)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <EmptyItems
                        title="No exercises added yet"
                        description="Click 'Add Exercises' to get started!"
                    />
                )}

                {/* Add Exercise Button */}
                {!isStartMode && (
                    <Button
                        className="w-full bg-white text-primary font-semibold border-2 border-dashed border-primary/30 hover:bg-primary/10"
                        onClick={handleAddExercise}
                        disabled={isCreating || isUpdating || isSaving}
                    >
                        <Plus className="size-4 mr-1" />
                        ADD EXERCISE
                    </Button>
                )}

                {/* Cancel Workout Button */}
                {isStartMode && (
                    <CancelWorkoutDialog action={handleCancelWorkout} />
                )}
            </div>
        </SubLayout>
    );
}