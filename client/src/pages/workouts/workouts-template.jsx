import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/api"; // Make sure this import path is correct
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Play, Trash2, Pencil } from "lucide-react";
import { toast } from "react-hot-toast";


function WorkoutTemplate({
    id,
    title
}) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // ===== GET EXERCISES =====
    const getTemplateExercises = async () => {
        // Get exercises that belong to this specific template
        const response = await api.get(`workouts/templates/${id}/exercises/`);
        return response.data;
    }

    const {
        data: exercises = [],
        isPending: isPendingExercise,
        isError: isErrorExercise,
    } = useQuery({
        queryKey: ["template_exercises_list", id],   // Include template id in query key
        queryFn: getTemplateExercises,
        enabled: Boolean(id),                   // Only run if we have a template id
    });
    // ===== END GET =====

    // ===== DELETE TEMPLATE =====
    const deleteTemplate = async (templateId) => {
        await api.delete(`workouts/templates/${templateId}/`);
    }

    const {
        mutate: deleteTemplateMutation,
        isLoading: isDeleting
    } = useMutation({
        mutationFn: deleteTemplate,
        onSuccess: () => {
            // Invalidate the templates query to refetch data
            queryClient.invalidateQueries({ queryKey: ["templates"] });
            toast.success("Template deleted successfully!");
        },
        onError: (error) => {
            toast.error(`Error deleting template: ${error.response?.data?.message || error.message}`);
        }
    });
    // ===== END DELETE =====

    // ===== EVENT HANDLERS =====
    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
            deleteTemplateMutation(id);
        }
    };

    const handleEdit = () => {
        navigate(`/workouts/templates/${id}/edit`);
    };

    const handleStartWorkout = () => {
        // Navigate to workout session or implement workout logic
        navigate(`/workouts/templates/${id}/start`);
        // Or you could show a toast if not implemented yet:
        // toast.info("Workout feature coming soon!");
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
        <AccordionItem value={`item-${id}`} className="shadow-sm rounded-lg">
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
                    <Button
                        variant="delete"
                        size="sm"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full"
                    >
                        <Trash2 className="size-3 mr-2" />
                        {isDeleting ? "Deleting..." : "Delete"}
                    </Button>

                    <Button
                        variant="edit"
                        size="sm"
                        onClick={handleEdit}
                        className="w-full"
                    >
                        <Pencil className="size-3 mr-2" />
                        Edit
                    </Button>

                    <Button
                        size="sm"
                        onClick={handleStartWorkout}
                        disabled={exercises.length === 0}
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

export { WorkoutTemplate }