"use client"

import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import apiNinjas from "@/apiNinjas";
import { clsx } from "clsx";
import { cn } from "@/lib/utils";
import { SubLayout } from "@/layouts/sub-layout";
import { ArrowLeft, Search, ListFilter, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function SearchExercise() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [submittedSearchTerm, setSubmittedSearchTerm] = useState(""); // State to trigger search
    const [selectedItems, setSelectedItems] = useState(new Set());

    // ===== GET EXERCISES =====
    const getExercises = async ({ queryKey }) => {
        const [_, searchName] = queryKey;
        // if a search term is provided, use that to query
        if (searchName) {
            const response = await apiNinjas.get(`exercises?name=${searchName}`);
            return response.data;
        } else {
            // if no search term is provided, default to beginner
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
    // ===== END GET =====

    // ===== SELECT STATE =====
    const toggleItemSelection = (itemId) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            // if already selected, de-select it
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    // Bool value for check button
    const hasSelectedItems = selectedItems.size > 0;
    // ===== END SELECT =====

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmittedSearchTerm(searchTerm);
    };

    const exercises = data || [];

    return (
        <SubLayout>
            <div className="grid grid-cols-[auto_1fr_auto] grid-rows-2 items-center gap-2">
                {/* Row 1 */}
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
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
                    variant="ghost"
                    className="h-10 fixed bottom-4 right-4 rounded-full bg-primary-500 text-white shadow-lg"
                >
                    <Check className="size-5 stroke-3" />
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
                "px-3 py-2 rounded-lg  hover:shadow-sm transition-all delay-20 duration-100 ease-in-out cursor-pointer",
                { "hover:bg-primary-100": !isSelected },
                { "bg-primary-300 shadow-sm": isSelected }
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
        </div>
    );
}

export { SearchExercise }