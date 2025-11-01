// import { useCallback, useEffect, useRef } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { useTemplates } from "@/hooks/workouts/templates/useTemplates";
// import { useTemplateActions } from "@/hooks/workouts/templates/useTemplateActions";
// import { useAtom } from "jotai";
// import { templateTitleAtom, templateIdAtom } from "./template-atoms";
// import { selectedExercisesAtom, templateModeAtom, startedAtAtom, completedAtAtom } from "./template-atoms";
// import { X, FlagTriangleRight, Plus } from "lucide-react";
// import { SubLayout } from "@/layouts/sub-layout";
// import { ExerciseCard } from "./exercise-card";
// import { Button } from "@/components/ui/button";
// import { buttonVariants } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
// import { EmptyItems } from "@/components/empty-items";

// // Component for Creating/Editing/Starting a workout routine
// export function WorkoutsTemplate() {
//     const location = useLocation();
//     const navigate = useNavigate();

//     // Nav states
//     const is_alternative = location.state?.isAlternative || false;
//     const template_data = location.state?.templateObj || null;

//     // Atoms
//     const [title, setTitle] = useAtom(templateTitleAtom);
//     const [selectedExercises, setSelectedExercises] = useAtom(selectedExercisesAtom);
//     const [templateMode, setTemplateMode] = useAtom(templateModeAtom);
//     const [template_id, setTemplate_id] = useAtom(templateIdAtom);

//     // Mode Selection
//     const isEditMode = templateMode === "edit";
//     const isCreateMode = templateMode === "create";
//     const isStartMode = templateMode === "start";

//     // Track if we've already populated the atoms to prevent re-population
//     const hasPopulatedAtoms = useRef(false);

//     // Convert Map to Array for easier rendering
//     const exercisesArray = Array.from(selectedExercises.values());
//     const hasExercises = exercisesArray.length > 0;
//     const canSave = title.trim().length > 0 && hasExercises;

//     // Create template with exercise mutation
//     const {
//         createTemplate,
//         isCreating,
//         updateTemplate,
//         isUpdating,
//     } = useTemplates();

//     const {
//         saveTemplate,
//         isSaving,
//     } = useTemplateActions();

//     // Populate atoms with template data when editing (only once)
//     useEffect(() => {
//         if ((isEditMode || isStartMode) && template_data && !hasPopulatedAtoms.current) {
//             // Set id
//             setTemplate_id(template_data.id || null);
//             // Set the title
//             setTitle(template_data.title || '');

//             // Convert template exercises to the format expected by selectedExercises atom
//             const exercisesMap = new Map();

//             if (template_data.template_exercises && template_data.template_exercises.length > 0) {
//                 template_data.template_exercises.forEach((templateExercise) => {
//                     const exercise = templateExercise.exercise;

//                     // Create the exercise key (same format used in search)
//                     const exerciseKey = `${exercise.name}_${exercise.muscle || 'no_muscle'}`;

//                     // Create the exercise object with all necessary data
//                     const exerciseData = {
//                         // Exercise basic info
//                         name: exercise.name,
//                         type: exercise.type || '',
//                         muscle: exercise.muscle || '',
//                         equipment: exercise.equipment || '',
//                         difficulty: exercise.difficulty || '',
//                         instructions: exercise.instructions || '',

//                         // Template exercise specific data
//                         sets_data: templateExercise.sets_data || [
//                             { reps: null, weight: null }
//                         ],
//                         rest_time: templateExercise.rest_time || null,
//                         notes: templateExercise.notes || '',

//                         // Additional metadata for editing/starting - CRUCIAL FOR UPDATES
//                         template_exercise_id: templateExercise.id,
//                         order: templateExercise.order || 0,
//                     };

//                     exercisesMap.set(exerciseKey, exerciseData);
//                 });
//             }

//             setSelectedExercises(exercisesMap);
//             hasPopulatedAtoms.current = true; // Mark as populated
//         }
//     }, [isEditMode, isStartMode, template_data, setTitle, setSelectedExercises, setTemplate_id]);

//     // Only clear atoms when explicitly cancelled or successful save
//     const clearAtoms = useCallback(() => {
//         setTitle('');
//         setSelectedExercises(new Map());
//         setTemplate_id(null);
//         setTemplateMode("create"); // Reset mode to create
//         hasPopulatedAtoms.current = false;
//     }, [setTitle, setSelectedExercises, setTemplate_id, setTemplateMode]);

//     // ===== EVENT HANDLERS =====
//     const handleAddExercise = () => {
//         // Navigate to search but maintain the navigation state
//         navigate("search", {
//             state: location.state // Pass through the current state
//         });
//     };

//     const handleSubmit = (e) => {
//         e.preventDefault();

//         // Prepare template data for API with proper sets_data structure
//         const templateData = {
//             title: title.trim(),
//             isAlternative: is_alternative,
//             exercises: exercisesArray.map(exercise => ({
//                 // Include template_exercise_id for existing exercises in edit mode
//                 ...(isEditMode && exercise.template_exercise_id && {
//                     template_exercise_id: exercise.template_exercise_id
//                 }),

//                 name: exercise.name,
//                 type: exercise.type || '',
//                 muscle: exercise.muscle || '',
//                 equipment: exercise.equipment || '',
//                 difficulty: exercise.difficulty || '',
//                 instructions: exercise.instructions || '',
//                 sets_data: exercise.sets_data || [
//                     { reps: null, weight: null },
//                 ],
//                 rest_time: exercise.rest_time || null,
//                 notes: exercise.notes || '',
//                 order: exercise.order || 0
//             }))
//         };

//         if (isEditMode) {
//             updateTemplate({
//                 templateId: template_id,
//                 templateData,
//             }, {
//                 onSuccess: (data) => {
//                     clearAtoms();
//                     navigate("/workouts");
//                 },
//                 onError: (error) => {
//                     console.error('Update failed:', error);
//                 }
//             });
//         } else if (isCreateMode) {
//             createTemplate(templateData, {
//                 onSuccess: () => {
//                     clearAtoms();
//                     navigate("/workouts");
//                 },
//                 onError: (error) => {
//                     console.error('Create failed:', error);
//                 }
//             });
//         } else if (isStartMode) {
//             saveTemplate({
//                 templateId: template_id,
//                 templateData
//             }, {
//                 onSuccess: () => {
//                     console.log("Workout Saved!");
//                 },
//             });
//             console.log("Payload: ", { ...templateData });
//         }
//     };

//     const handleCancel = () => {
//         // Clear atoms and navigate back
//         clearAtoms();
//         navigate(-1, { replace: true });
//     };

//     // Memoize these functions to prevent recreating on every render
//     const handleRemoveExercise = useCallback((exerciseKey) => {
//         setSelectedExercises(prev => {
//             const newMap = new Map(prev);
//             const removedExercise = newMap.get(exerciseKey);

//             newMap.delete(exerciseKey);

//             return newMap;
//         });
//     }, [setSelectedExercises]);

//     const handleUpdateExercise = useCallback((exerciseKey, updates) => {
//         setSelectedExercises(prev => {
//             const newMap = new Map(prev);
//             const exercise = newMap.get(exerciseKey);
//             if (exercise) {
//                 newMap.set(exerciseKey, { ...exercise, ...updates });
//             }
//             return newMap;
//         });
//     }, [setSelectedExercises]);

//     const handleTitleChange = (e) => {
//         setTitle(e.target.value);
//     };
//     // ===== END EVENT HANDLERS =====

//     // Determine UI text based on mode
//     const pageTitle = isEditMode ? `Edit Template` : `Create Template`;
//     const buttonText = isEditMode ? (isUpdating ? "Updating..." : "Update") : (isCreating ? "Saving..." : "Save");
//     const cancelText = isEditMode ? "Cancel Template Editing?" : "Cancel Template Creation?";

//     // Main View
//     return (
//         <SubLayout>
//             {/* Header */}
//             <div className="grid grid-cols-[auto_1fr] items-center gap-2">
//                 {/* Alert Dialog for closing/cancelling */}
//                 <AlertDialog>
//                     <AlertDialogTrigger>
//                         <X />
//                     </AlertDialogTrigger>
//                     <AlertDialogContent>
//                         <AlertDialogHeader>
//                             <AlertDialogTitle>
//                                 {cancelText}
//                             </AlertDialogTitle>
//                             <AlertDialogDescription>
//                                 Are you absolutely sure? Any unsaved changes will be lost.
//                             </AlertDialogDescription>
//                         </AlertDialogHeader>
//                         <AlertDialogFooter>
//                             <AlertDialogCancel>Cancel</AlertDialogCancel>
//                             <AlertDialogAction
//                                 onClick={handleCancel}
//                                 className={buttonVariants({ variant: "destructive" })}
//                             >
//                                 Continue
//                             </AlertDialogAction>
//                         </AlertDialogFooter>
//                     </AlertDialogContent>
//                 </AlertDialog>

//                 <form onSubmit={handleSubmit} className="grid grid-cols-[1fr_auto] gap-2">
//                     {/* Template title input */}
//                     <Input
//                         type="text"
//                         id="template_title"
//                         value={title}
//                         onChange={handleTitleChange}
//                         variant="ghost"
//                         className="h-7 border-b-gray-700"
//                         placeholder="Enter template title..."
//                         disabled={isCreating || isUpdating}
//                     />

//                     <Button
//                         type="submit"
//                         className="h-7 ml-3"
//                         disabled={isCreating || !canSave || isUpdating}
//                     >
//                         <FlagTriangleRight />
//                         {buttonText}
//                     </Button>
//                 </form>
//             </div>

//             {/* Body */}
//             <div className="flex flex-col gap-3">
//                 {/* Debug info - remove in prod */}
//                 <div className="bg-gray-100 p-2 rounded text-xs">
//                     <p><strong>Debug:</strong> Mode: {templateMode} | Title: "{title}" | Exercises: {exercisesArray.length} | Can Save: {canSave ? 'Yes' : 'No'}</p>
//                     <p><strong>Template ID:</strong> {template_id} | <strong>Populated:</strong> {hasPopulatedAtoms.current ? 'Yes' : 'No'}</p>
//                     <p><strong>Exercise IDs:</strong> {exercisesArray.map(ex => `${ex.name}:${ex.template_exercise_id || 'NEW'}`).join(', ')}</p>
//                 </div>

//                 {/* Show exercises */}
//                 {hasExercises ? (
//                     <div className="flex flex-col gap-2">
//                         <div className="flex justify-between items-center">
//                             <h3 className="font-semibold text-sm text-gray-700">
//                                 Exercises ({exercisesArray.length})
//                             </h3>
//                         </div>
//                         <div className="space-y-4">
//                             {exercisesArray.map((exercise, index) => {
//                                 const exerciseKey = `${exercise.name}_${exercise.muscle || 'no_muscle'}`;
//                                 return (
//                                     <div key={exerciseKey} className="relative group">
//                                         <ExerciseCard
//                                             exercise={exercise}
//                                             templateMode={templateMode}
//                                             onRemove={() => handleRemoveExercise(exerciseKey)}
//                                             onUpdate={(updates) => handleUpdateExercise(exerciseKey, updates)}
//                                         />
//                                     </div>
//                                 );
//                             })}
//                         </div>
//                     </div>
//                 ) : (
//                     <EmptyItems
//                         title="No exercises added yet"
//                         description="Click 'Add Exercises' to get started!"
//                     />
//                 )}

//                 {/* Add Exercise Button */}
//                 <Button
//                     className="w-full bg-white text-primary font-semibold border-2 border-dashed border-primary/30 hover:bg-primary/10"
//                     onClick={handleAddExercise}
//                     disabled={isCreating || isUpdating}
//                 >
//                     <Plus className="size-4 mr-1" />
//                     ADD EXERCISE
//                 </Button>
//             </div>
//         </SubLayout>
//     );
// }




import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTemplates } from "@/hooks/workouts/templates/useTemplates";
import { useTemplateActions } from "@/hooks/workouts/templates/useTemplateActions";
import { useAtom } from "jotai";
import { templateTitleAtom, templateIdAtom } from "./template-atoms";
import { selectedExercisesAtom, templateModeAtom, startedAtAtom, completedAtAtom } from "./template-atoms";
import { X, FlagTriangleRight, Plus } from "lucide-react";
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

    // Create template with exercise mutation
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

    // Set workout start time when starting a workout
    useEffect(() => {
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

    // Only clear atoms when explicitly cancelled or successful save
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

        if (isStartMode) {
            // Set completion time when finishing workout
            const completedTime = new Date().toISOString();
            setCompleted_at(completedTime);

            // Prepare completed workout data for the backend
            const completedWorkoutData = {
                template_id: template_id,
                template_title: title.trim(),
                started_at: started_at,
                completed_at: completed_at,
                workout_notes: "notes",
                completed_exercises: exercisesArray.map((exercise, index) => ({
                    exercise_name: exercise.name,
                    performed_sets_data: exercise.sets_data || [
                        { reps: null, weight: null }
                    ],
                    exercise_notes: exercise.notes || '',
                    order: exercise.order || index
                }))
            };

            console.log("Completed Workout Payload: ", completedWorkoutData);

            saveTemplate({
                templateId: template_id,
                templateData: completedWorkoutData
            }, {
                onSuccess: () => {
                    toast.success("Workout completed and saved!");
                    clearAtoms();
                    navigate("/workouts");
                },
                onError: (error) => {
                    console.error('Save workout failed:', error);
                    toast.error("Failed to save workout");
                }
            });

            return;
        }

        // Original template creation/editing logic
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
                    toast.success("Template updated successfully!");
                    clearAtoms();
                    navigate("/workouts");
                },
                onError: (error) => {
                    console.error('Update failed:', error);
                    toast.error("Failed to update template");
                }
            });
        } else if (isCreateMode) {
            createTemplate(templateData, {
                onSuccess: () => {
                    toast.success("Template created successfully!");
                    clearAtoms();
                    navigate("/workouts");
                },
                onError: (error) => {
                    console.error('Create failed:', error);
                    toast.error("Failed to create template");
                }
            });
        }
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

                    <Button
                        type="submit"
                        className="h-7 ml-3"
                        disabled={isCreating || !canSave || isUpdating || isSaving}
                    >
                        <FlagTriangleRight />
                        {buttonText}
                    </Button>
                </form>
            </div>

            {/* Workout Session Info (only in start mode) */}
            {isStartMode && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-blue-800">Workout Session</h3>
                        <span className="text-blue-600 font-mono">
                            {workoutDuration} minutes
                        </span>
                    </div>
                    <textarea
                        // value={workoutNotes}
                        onChange={handleWorkoutNotesChange}
                        placeholder="Add workout notes..."
                        className="w-full p-2 text-sm border rounded resize-none"
                        rows={2}
                    />
                </div>
            )}

            {/* Body */}
            <div className="flex flex-col gap-3">
                {/* Debug info - remove in prod */}
                <div className="bg-gray-100 p-2 rounded text-xs">
                    <p><strong>Debug:</strong> Mode: {templateMode} | Title: "{title}" | Exercises: {exercisesArray.length} | Can Save: {canSave ? 'Yes' : 'No'}</p>
                    <p><strong>Template ID:</strong> {template_id} | <strong>Populated:</strong> {hasPopulatedAtoms.current ? 'Yes' : 'No'}</p>
                    {isStartMode && (
                        <p><strong>Started:</strong> {started_at ? new Date(started_at).toLocaleTimeString() : 'Not set'} | <strong>Duration:</strong> {workoutDuration} min</p>
                    )}
                </div>

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
            </div>
        </SubLayout>
    );
}