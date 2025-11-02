import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTemplates } from "@/hooks/workouts/templates/useTemplates";
import { useTemplateActions } from "@/hooks/workouts/templates/useTemplateActions";
import { useAtom } from "jotai";
import { templateTitleAtom, templateIdAtom } from "./template-atoms";
import { selectedExercisesAtom, templateModeAtom, startedAtAtom, completedAtAtom } from "./template-atoms";
import { X, FlagTriangleRight, Plus, CircleX } from "lucide-react";
import { SubLayout } from "@/layouts/sub-layout";
import { ExerciseCard } from "./exercise-card";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { EmptyItems } from "@/components/empty-items";
import toast from "react-hot-toast";

// Component for Creating/Editing/Starting a workout routine
export function WorkoutsTemplate() {
    const location = useLocation();
    const navigate = useNavigate();

    // Nav states
    const is_alternative = location.state?.isAlternative || false;
    const template_data = location.state?.templateObj || null;

    // ===== ATOMS =====
    const [title, setTitle] = useAtom(templateTitleAtom);
    const [selectedExercises, setSelectedExercises] = useAtom(selectedExercisesAtom);
    const [templateMode, setTemplateMode] = useAtom(templateModeAtom);
    const [template_id, setTemplate_id] = useAtom(templateIdAtom);
    // Workout timing atoms
    const [started_at, setStarted_at] = useAtom(startedAtAtom);
    const [completed_at, setCompleted_at] = useAtom(completedAtAtom);
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
            console.log('Workout started at:', startTime);
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

            if (template_data.template_exercises && template_data.template_exercises.length > 0) {
                template_data.template_exercises.forEach((templateExercise) => {
                    const exercise = templateExercise.exercise;

                    // Create the exercise key (same format used in search)
                    const exerciseKey = `${exercise.name}_${exercise.muscle || 'no_muscle'}`;

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
                        rest_time: templateExercise.rest_time || null,
                        notes: templateExercise.notes || '',

                        // Additional metadata for editing/starting - CRUCIAL FOR UPDATES
                        template_exercise_id: templateExercise.id,
                        order: templateExercise.order || 0,
                    };

                    exercisesMap.set(exerciseKey, exerciseData);
                });
            }

            setSelectedExercises(exercisesMap);
            hasPopulatedAtoms.current = true; // Mark as populated
        }
    }, [isEditMode, isStartMode, template_data, setTitle, setSelectedExercises, setTemplate_id]);
    // ===== END EFFECTS =====

    // Utility function to clear all atoms
    const clearAtoms = useCallback(() => {
        setTitle('');
        setSelectedExercises(new Map());
        setTemplate_id(null);
        setTemplateMode("create"); // Reset mode to create
        setStarted_at(null);
        setCompleted_at(null);
        hasPopulatedAtoms.current = false;
    }, [setTitle, setSelectedExercises, setTemplate_id, setTemplateMode, setStarted_at, setCompleted_at]);

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
            isAlternative: is_alternative,
            exercises: exercisesArray.map(exercise => ({
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
                rest_time: exercise.rest_time || null,
                notes: exercise.notes || '',
                order: exercise.order || 0
            }))
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

        // Filter exercises and sets - only include exercises with at least one completed set
        const completedExercisesData = [];

        exercisesArray.forEach((exercise, index) => {
            // Filter only completed sets (both reps and weight are filled)
            const completedSets = exercise.sets_data.filter(set =>
                set.reps !== null && set.reps !== '' &&
                set.weight !== null && set.weight !== ''
            );

            // Only include exercise if it has at least one completed set
            if (completedSets.length > 0) {
                completedExercisesData.push({
                    exercise_name: exercise.name,
                    performed_sets_data: completedSets, // Only the completed sets
                    exercise_notes: exercise.notes || '',
                    order: exercise.order || index
                });
            }
        });

        // Don't proceed if no exercises were completed
        if (completedExercisesData.length === 0) {
            toast.error("No completed sets found. Please complete at least one set before finishing your workout.");
            return;
        }

        // Prepare completed workout data for the backend
        const completedWorkoutData = {
            template_id: template_id,
            template_title: title.trim(),
            started_at: started_at,
            completed_at: completedTime,
            workout_notes: "notes",
            completed_exercises: completedExercisesData
        };

        // Save the completed workout using the mutation
        saveTemplate({
            templateId: template_id,
            templateData: completedWorkoutData
        }, {
            onSuccess: () => {
                toast.success(`Workout completed! Saved ${completedExercisesData.length} exercises with completed sets.`);
                clearAtoms();
                navigate("/workouts");
            },
            onError: (error) => {
                console.error('Save workout failed:', error);
                toast.error("Failed to save workout");
            }
        });
    };

    const handleCancel = () => {
        // Clear atoms and navigate back
        clearAtoms();
        navigate(-1, { replace: true });
    };

    // Memoize these functions to prevent recreating on every render
    const handleRemoveExercise = useCallback((exerciseKey) => {
        setSelectedExercises(prev => {
            const newMap = new Map(prev);
            const removedExercise = newMap.get(exerciseKey);

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
    }, [setSelectedExercises]);

    const handleTitleChange = (e) => {
        setTitle(e.target.value);
    };

    const handleWorkoutNotesChange = (e) => {
        // setWorkoutNotes(e.target.value);
    };

    const handleCancelWorkout = () => {
        clearAtoms();
        navigate(-1, { replace: true });
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
            <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                {/* Alert Dialog for closing/cancelling */}
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
                                            e.preventDefault(); // Prevent dialog from opening
                                            e.stopPropagation(); // Stop event propagation
                                            toast.error("Please complete at least one set before finishing your workout.");
                                            return;
                                        }
                                        // If validation passes, the dialog will open automatically
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
                {/* Debug info - remove in prod */}
                {/* <div className="bg-gray-100 p-2 rounded text-xs">
                    <p><strong>Debug:</strong> Mode: {templateMode} | Title: "{title}" | Exercises: {exercisesArray.length} | Can Save: {canSave ? 'Yes' : 'No'}</p>
                    <p><strong>Template ID:</strong> {template_id} | <strong>Populated:</strong> {hasPopulatedAtoms.current ? 'Yes' : 'No'}</p>
                    {isStartMode && (
                        <p><strong>Started:</strong> {started_at ? new Date(started_at).toLocaleTimeString() : 'Not set'} | <strong>Duration:</strong> {workoutDuration} min</p>
                    )}
                </div> */}

                {/* Show exercises */}
                {hasExercises ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-sm text-gray-700">
                                Exercises ({exercisesArray.length})
                            </h3>
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

                {/* Add Exercise Button - Hide in start mode */}
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

                {isStartMode && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                className="w-full bg-white text-destructive font-semibold border-2 border-dashed border-destructive/30 hover:bg-destructive/10"
                            >
                                <CircleX className="size-4" />
                                CANCEL WORKOUT
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Cancel Workout Session?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to cancel this workout? All your progress will be lost and cannot be recovered.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Keep Working Out</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleCancelWorkout}
                                    className={buttonVariants({ variant: "destructive" })}
                                >
                                    Cancel Workout
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </SubLayout>
    );
}