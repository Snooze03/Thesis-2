"use client"

import { useQueryClient } from "@tanstack/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/api";
import { toast } from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge";
import { Button } from "../../components/ui/button";
import { Play, Trash2, Pencil } from "lucide-react";

function WorkoutTemplate({
    id,
    title,
}) {
    const queryClient = useQueryClient();

    // ===== GET EXERCISES =====
    const getExercises = async () => {
        // Gets all exercises that belongs to the template
        const response = await api.get("workouts/exercises/");
        return response.data;
    }

    const {
        data: exercises = [],
        isPending: isPendingExercise,
        isError: isErrorExercise,
    } = useQuery({
        queryKey: ["exercises"],
        queryFn: getExercises,
    })
    // ===== END GET =====

    // ===== DELETE REQUEST =====
    const deleteTemplate = async (id) => {
        await api.delete(`workouts/templates/${id}/`);
    }

    const {
        mutate,
        isLoading: isDeleting
    } = useMutation({
        mutationFn: deleteTemplate,
        onSuccess: () => {
            // Invalidate the templates query to refetch data
            queryClient.invalidateQueries({ queryKey: ["templates"] });
            toast.success("Template deleted!")
        },
        onError: (error) => {
            toast.error(`Error: ${error.message}`);
        }
    });
    // ===== END DELETE =====

    return (
        <AccordionItem value={`item-${id}`} className="shadow-sm rounded-lg">
            <AccordionTrigger>
                {title}
                <Badge>
                    workouts
                </Badge>
            </AccordionTrigger>
            <AccordionContent className="px-5 py-4 space-y-3">

                {isPendingExercise ? (
                    <LoadingSpinner message="exercises" />
                ) : exercises.length > 0 ? (
                    exercises.map((exercise, index) => {
                        return (
                            <div className="grid grid-cols-[min-content_auto] gap-3" key={exercise + index}>
                                <div className="grid place-items-center size-10 bg-primary-300 rounded-full">
                                    <p>3x</p>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <p>{exercise.name}</p>
                                    <p className="text-gray-500">{exercise.equipment}</p>
                                </div>
                            </div>
                        );
                    })) : (
                    <h1>No exercises</h1>
                )}
                {/* Button Controls */}
                <div className="grid grid-cols-[auto_auto_auto] gap-3 mt-5">
                    <Button
                        variant="delete"
                        size="sm"
                        onClick={() => mutate(id)}
                        disabled={isDeleting}
                    >
                        <Trash2 className="size-3" />
                        Delete
                    </Button>
                    <Button variant="edit" size="sm">
                        <Pencil className="size-3" />
                        Edit
                    </Button>
                    <Button size="sm">
                        <Play className="size-3" />
                        Start Workout
                    </Button>
                </div>

            </AccordionContent>
        </AccordionItem>
    );
}

export { WorkoutTemplate }