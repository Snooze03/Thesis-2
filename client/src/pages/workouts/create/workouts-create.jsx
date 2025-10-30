import { useLocation, useNavigate } from "react-router-dom";
import { useTemplates } from "@/hooks/workouts/templates/useTemplates";
import { useAtom } from "jotai";
import { templateTitleAtom } from "./template-atoms";
import { selectedExercisesAtom } from "./search-atoms";
import { X, FlagTriangleRight, Plus } from "lucide-react";
import { SubLayout } from "@/layouts/sub-layout";
import { ExerciseCard } from "./exercise-card";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { EmptyItems } from "@/components/empty-items";
import { useCallback } from "react";

function CreateTemplate() {
    const location = useLocation();
    const navigate = useNavigate();
    const is_alternative = location.state?.isAlternative || false;

    // Atoms
    const [title, setTitle] = useAtom(templateTitleAtom);
    const [selectedExercises, setSelectedExercises] = useAtom(selectedExercisesAtom);

    // Convert Map to Array for easier rendering
    const exercisesArray = Array.from(selectedExercises.values());
    const hasExercises = exercisesArray.length > 0;
    const canSave = title.trim().length > 0 && hasExercises;

    // Create template with exercise mutation
    const {
        createTemplate,
        isCreating,
    } = useTemplates();

    const handleAddExercise = () => {
        navigate("search");
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Prepare template data for API with proper sets_data structure
        const templateData = {
            title: title.trim(),
            isAlternative: is_alternative,
            exercises: exercisesArray.map(exercise => ({
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
                notes: exercise.notes || ''
            }))
        };

        console.log('Creating template with data:', templateData);

        createTemplate(templateData, {
            onSuccess: () => {
                // Clear atoms after successful creation
                setTitle('');
                setSelectedExercises(new Map());
                navigate("/workouts");
            }
        });
    };

    const handleCancel = () => {
        // Clear atoms and navigate back
        setTitle('');
        setSelectedExercises(new Map());
        navigate(-1, { replace: true });
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
    }, [setSelectedExercises]);

    const handleTitleChange = (e) => {
        setTitle(e.target.value);
    };

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
                                Cancel Template Creation?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you absolutely sure? Any unsaved changes will be lost.
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
                        className="h-7"
                        placeholder="Enter template title..."
                        disabled={isCreating}
                    />

                    <Button
                        type="submit"
                        className="h-7 ml-3"
                        disabled={isCreating || !canSave}
                    >
                        <FlagTriangleRight />
                        {isCreating ? "Saving..." : "Save"}
                    </Button>
                </form>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-3">
                {/* Debug info - remove in prod */}
                <div className="bg-gray-100 p-2 rounded text-xs">
                    <p><strong>Debug:</strong> Title: "{title}" | Exercises: {exercisesArray.length} | Can Save: {canSave ? 'Yes' : 'No'}</p>
                    <p><strong>Sets Data Structure:</strong> Using sets_data array format</p>
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
                                            isEditing={true}
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
                <Button
                    className="w-full bg-white text-primary font-semibold border-2 border-dashed border-primary/30 hover:bg-primary/10"
                    onClick={handleAddExercise}
                    disabled={isCreating}
                >
                    <Plus className="size-4 mr-1" />
                    ADD EXERCISE
                </Button>
            </div>
        </SubLayout>
    );
}

export { CreateTemplate };