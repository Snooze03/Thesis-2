"use client"

import { clsx } from "clsx";
import { cn } from "@/lib/utils";
import { SubLayout } from "@/layouts/sub-layout";
import { ArrowLeft, Search, ListFilter, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useExerciseSearch } from "@/hooks/workouts/useExerciseSearch";

function SearchExercise() {
    const {
        searchTerm,
        setSearchTerm,
        selectedExercises,
        hasSelectedItems,
        exercises,
        isLoading,
        isError,
        isAdding,
        toggleItemSelection,
        isSelected,
        handleSearch,
        addSelectedExercises,
        handleBackToEdit,
    } = useExerciseSearch();

    return (
        <SubLayout>
            <div className="grid grid-cols-[auto_1fr_auto] grid-rows-2 items-center gap-2">
                {/* Row 1 */}
                <Button
                    variant="ghost"
                    onClick={handleBackToEdit}
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
                <form onSubmit={handleSearch} className="relative w-full block col-span-4">
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
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <p>Loading exercises...</p>
                        </div>
                    ) : exercises.length > 0 ? (
                        // Render lists items
                        exercises.map((exercise, index) => (
                            <ListItem
                                key={`${exercise.name}_${index}`}
                                exercise={exercise}
                                index={index}
                                isSelected={isSelected(exercise, index)}
                                onToggle={() => toggleItemSelection(exercise, index)}
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
                    onClick={addSelectedExercises}
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
                            Add {selectedExercises.size} Exercise{selectedExercises.size !== 1 ? 's' : ''}
                        </>
                    )}
                </Button>
            )}
        </SubLayout>
    );
}

function ListItem({ exercise, index, isSelected, onToggle }) {
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