"use client"

import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import api from "@/api";
import apiNinjas from "@/apiNinjas";
import { clsx } from "clsx";
import { cn } from "@/lib/utils";
import { SubLayout } from "@/layouts/sub-layout";
import { ArrowLeft, Search, ListFilter, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";

function SearchExercise() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [submittedSearchTerm, setSubmittedSearchTerm] = useState("");
    const [selectedItems, setSelectedItems] = useState(new Set());
    let { template_id } = useParams();

    // ===== GET EXERCISES VIA NINJA API =====
    const getExercises = async ({ queryKey }) => {
        const [_, searchName] = queryKey;
        if (searchName) {
            // if a search term is provided, use it
            const response = await apiNinjas.get(`exercises?name=${searchName}`);
            return response.data;
        } else {
            // if not default to beginner parameter
            const response = await apiNinjas.get(`exercises?difficulty=beginner`);
            return response.data;
        }
    };

    const {
        data,
        isPending,
        isError,
    } = useQuery({
        queryKey: ["search_exercises", submittedSearchTerm],
        queryFn: getExercises,
        staleTime: Infinity,
        cacheTime: Infinity,
    });
    // ===== END GET EXERCISES =====

    // ===== ADD EXERCISES TO TEMPLATE =====
    const addExercisesToTemplate = async ({ templateId, exercises }) => {
        const response = await api.post(
            `workouts/templates/${templateId}/add_exercises/`,
            { exercises: exercises }
        );
        return response.data;
    };

    const {
        mutate: addExercises,
        isLoading: isAdding
    } = useMutation({
        mutationFn: addExercisesToTemplate,
        onSuccess: (data) => {
            const successCount = data.created?.length || 0;
            const errorCount = data.errors?.length || 0;

            if (errorCount > 0) {
                // toast.success(`Added ${successCount} exercises. ${errorCount} had issues.`);
                // Show specific errors in console for debugging
                if (data.errors) {
                    console.log('Exercise addition issues:', data.errors);
                    data.errors.forEach(error => {
                        if (error.error !== 'Exercise already exists in this template') {
                            console.error(`Issue with ${error.exercise}:`, error.error);
                        }
                    });
                }
            }
            // else {
            //     toast.success(`Successfully added ${successCount} exercise(s) to your template!`);
            // }

            // Clear selections and navigate back to template editing
            setSelectedItems(new Set());
            navigate(`/workouts/templates/${template_id}/edit`);
        },
        onError: (error) => {
            console.error('Error adding exercises:', error);
            toast.error(`Error adding exercises: ${error.response?.data?.error || error.message}`);
        }
    });
    // ===== END ADD EXERCISE =====

    // ===== SELECT STATE =====
    const toggleItemSelection = (itemId) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const hasSelectedItems = selectedItems.size > 0;

    // ===== EVENT HANDLERS =====
    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmittedSearchTerm(searchTerm);
    };

    const handleAddSelectedExercises = () => {
        if (!hasSelectedItems) return;

        const exercises = data || [];

        // Get selected exercise objects and map their indices
        const selectedExercises = exercises
            .map((exercise, index) => ({ exercise, originalIndex: index }))
            .filter(({ originalIndex }) =>
                selectedItems.has(exercises[originalIndex].name + originalIndex)
            )
            .map(({ exercise }) => exercise);

        // Transform exercises to match Django model fields
        const exercisesToAdd = selectedExercises.map(exercise => ({
            name: exercise.name || '',
            type: exercise.type || '',
            muscle: exercise.muscle || '',
            equipment: exercise.equipment || '',
            difficulty: exercise.difficulty || '',
            instructions: exercise.instructions || ''
        }));

        // console.log('Adding exercises:', exercisesToAdd); // Debug log

        addExercises({
            templateId: template_id,
            exercises: exercisesToAdd
        });
    };

    const exercises = data || [];

    return (
        <SubLayout>
            <div className="grid grid-cols-[auto_1fr_auto] grid-rows-2 items-center gap-2">
                {/* Row 1 */}
                <Button
                    variant="ghost"
                    onClick={() => navigate(`/workouts/templates/${template_id}/edit`)}
                    disabled={isAdding}
                >
                    <ArrowLeft />
                </Button>

                <h1 className="font-bold">Add Exercise</h1>

                {/* Filter, do this later on after CRUD */}
                <Button variant="ghost" className="justify-self-end">
                    <ListFilter />
                </Button>

                {/* Row 2 */}
                <form onSubmit={handleSubmit} className="relative w-full block col-span-4">
                    <Input
                        id="search_input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="col-span-4 pl-10"
                        placeholder="search for an exercise"
                        disabled={isAdding}
                    />
                    <Search className={cn(
                        "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none",
                    )} />
                </form>
            </div>

            <div className="flex flex-col gap-2">
                {isError && (
                    <div className="flex justify-center items-center h-64">
                        <p>Error loading exercises. Please try again.</p>
                    </div>
                )}

                {/* List out exercises upon success */}
                <div className="flex flex-col gap-2">
                    {isPending ? (
                        <div className="flex justify-center items-center h-64">
                            <p>Loading exercises...</p>
                        </div>
                    ) : exercises.length > 0 ? (
                        // Render lists items
                        exercises.map((exercise, index) => (
                            <ListItem
                                key={exercise.name + index}
                                id={exercise.name + index}
                                exercise={exercise}
                                isSelected={selectedItems.has(exercise.name + index)}
                                onToggle={() => toggleItemSelection(exercise.name + index)}
                            />
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            No exercises found
                        </div>
                    )}
                </div>
            </div>

            {/* Show button if an item is selected */}
            {hasSelectedItems && (
                <Button
                    variant="default"
                    className="h-12 fixed bottom-6 right-6 rounded-full shadow-lg px-6"
                    onClick={handleAddSelectedExercises}
                    disabled={isAdding}
                >
                    {isAdding ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Adding...
                        </>
                    ) : (
                        <>
                            <Check className="size-5 stroke-3" />
                            Add {selectedItems.size} Exercise{selectedItems.size !== 1 ? 's' : ''}
                        </>
                    )}
                </Button>
            )}
        </SubLayout>
    );
}

function ListItem({ id, exercise, isSelected, onToggle }) {
    // Function to format muscle group
    const formatString = (str) => {
        if (!str) return "";
        return str
            .split("_") // Splits "lower_back" into ["lower", "back"]
            .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalizes each word
            .join(" "); // Joins them back with a space: "Lower Back"
    };

    const formattedMuscle = formatString(exercise.muscle);

    return (
        <div
            className={clsx(
                "px-3 py-2 rounded-lg hover:shadow-sm transition-all delay-20 duration-100 ease-in-out cursor-pointer border",
                {
                    "hover:bg-primary-50 border-gray-200": !isSelected,
                    "bg-primary-100 border-primary-300 shadow-sm": isSelected
                }
            )}
            onClick={onToggle}
        >
            {/* Render list items using the exercise lists */}
            <div className="flex gap-2">
                <p className="font-medium">
                    {exercise.name}
                </p>
                {exercise.muscle &&
                    <p className="text-gray-600">
                        ({formattedMuscle})
                    </p>
                }
            </div>
            {exercise.equipment && (
                <p className="text-gray-600 text-sm">
                    {exercise.equipment}
                </p>
            )}
            {exercise.difficulty && (
                <p className="text-xs text-gray-500 capitalize">
                    {exercise.difficulty}
                </p>
            )}
        </div>
    );
}

export { SearchExercise }