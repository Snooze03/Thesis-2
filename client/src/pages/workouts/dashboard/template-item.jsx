import { useTemplates } from "@/hooks/workouts/templates/useTemplates";
import { useTemplateExercises } from "@/hooks/workouts/useTemplateExercises";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Play, Trash2, Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function TemplateItem({ id, title }) {
    const navigate = useNavigate();

    const {
        deleteTemplate,
        isDeleting,
        navigateToStart
    } = useTemplates();

    const {
        exercises,
        isLoading: isPendingExercise,
        isError: isErrorExercise
    } = useTemplateExercises(id);

    // ===== EVENT HANDLERS =====
    const handleDelete = () => {
        deleteTemplate(id);
    };

    const handleEdit = () => {
        // Pass the complete template object 
        const templateObj = {
            id,
            title,
        };
        navigate("/workouts/templates/edit", {
            state: {
                templateObj,
                mode: "edit"
            }
        });
    };

    const handleStartWorkout = () => {
        const templateObj = {
            id,
            title,
        };
        navigateToStart(templateObj);
    };
    // ===== END EVENT HANDLERS =====

    // Helper function to format muscle group
    const formatMuscle = (muscle) => {
        if (!muscle) return "";
        return muscle
            .split("_")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    return (
        <AccordionItem value={`item-${id}`} className="shadow-xs rounded-lg">
            <AccordionTrigger className="px-4">
                {title}
                <Badge className="text-xs">
                    {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
                </Badge>
            </AccordionTrigger>

            <AccordionContent className="px-5 py-4 space-y-3">
                {/* Exercise List */}
                {isPendingExercise ? (
                    <LoadingSpinner message="exercises" />
                ) : isErrorExercise ? (
                    <div className="text-center py-4 text-red-500">
                        <p>Error loading exercises</p>
                    </div>
                ) : exercises.length > 0 ? (
                    <>
                        {exercises.map((templateExercise, index) => {
                            const exercise = templateExercise.exercise;
                            return (
                                <div
                                    className="grid grid-cols-[min-content_1fr] gap-3 rounded-lg"
                                    key={templateExercise.id || `exercise-${index}`}
                                >
                                    <div className="grid place-items-center size-10 bg-primary-300 rounded-full text-sm">
                                        <p>{templateExercise.sets || 3}x</p>
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <p className="font-medium truncate">{exercise.name}</p>
                                        <div className="flex gap-2 text-sm text-gray-600">
                                            {exercise.equipment && (
                                                <span>{exercise.equipment}</span>
                                            )}
                                            {exercise.equipment && exercise.muscle && (
                                                <span>•</span>
                                            )}
                                            {exercise.muscle && (
                                                <span>{formatMuscle(exercise.muscle)}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                ) : (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                        <p>No exercises added yet</p>
                        <p className="text-sm mt-1">Click "Edit" to add exercises</p>
                    </div>
                )}

                {/* Button Controls */}
                <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t">

                    <AlertDialog>
                        <AlertDialogTrigger className="border-2 border-red-400 rounded-lg">
                            <p className="flex items-center justify-center gap-1 text-red-400">
                                <Trash2 className="size-3 mr-2" />
                                Delete
                            </p>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your template
                                    and remove it from our servers.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDelete}
                                    className={buttonVariants({ variant: "destructive" })}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Button
                        variant="edit"
                        size="sm"
                        onClick={handleEdit}
                        className="w-full"
                        disabled={isDeleting}
                    >
                        <Pencil className="size-3 mr-2" />
                        Edit
                    </Button>

                    <Button
                        size="sm"
                        onClick={handleStartWorkout}
                        disabled={exercises.length === 0 || isDeleting}
                        className="w-full"
                    >
                        <Play className="size-3 mr-2" />
                        Start
                    </Button>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}