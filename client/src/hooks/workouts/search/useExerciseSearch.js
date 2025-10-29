import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { selectedExercisesAtom } from "@/pages/workouts/create/search-atoms";
import { useAtom } from "jotai";
import api from "@/api";
import apiNinjas from "@/apiNinjas";
import { toast } from "react-hot-toast";

export function useExerciseSearch(searchTerm) {
    const navigate = useNavigate();
    const [selectedExercises, setSelectedExercises] = useAtom(selectedExercisesAtom);

    const fetchExercises = useQuery({
        queryKey: ["search_exercises", searchTerm],
        queryFn: async () => {
            // Get exercises from API Ninjas
            if (searchTerm && searchTerm.trim()) {
                const response = await apiNinjas.get(`exercises?name=${searchTerm.trim()}`);
                return response.data;
            } else {
                const response = await apiNinjas.get(`exercises?difficulty=beginner`);
                return response.data;
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes instead of Infinity for search results
        cacheTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
    });

    // Action functions
    const toggleExerciseSelection = (exercise, index) => {
        // Use exercise name as unique key (or a combination if names might not be unique)
        const exerciseKey = `${exercise.name}_${exercise.muscle || 'no_muscle'}`;

        setSelectedExercises(prev => {
            const newMap = new Map(prev);
            if (newMap.has(exerciseKey)) {
                newMap.delete(exerciseKey);
            } else {
                newMap.set(exerciseKey, exercise);
            }
            return newMap;
        });
    };

    const isSelected = (exercise, index) => {
        const exerciseKey = `${exercise.name}_${exercise.muscle || 'no_muscle'}`;
        return selectedExercises.has(exerciseKey); // Fix: use correct variable name
    };

    const addSelectedExercises = () => {
        if (selectedExercises.size === 0) return;

        // Convert Map values to array
        const exercisesToAdd = Array.from(selectedExercises.values()).map(exercise => ({
            name: exercise.name || '',
            type: exercise.type || '',
            muscle: exercise.muscle || '',
            equipment: exercise.equipment || '',
            difficulty: exercise.difficulty || '',
            instructions: exercise.instructions || ''
        }));

        console.log('Selected exercises to add:', exercisesToAdd);

        // TODO: Integrate with your template creation context
        // For now, just navigate back to create page
        navigate("/workouts/templates/create");
    };

    const handleBackToEdit = () => {
        // Fix: navigate to create page instead of edit
        navigate("/workouts/templates/create");
    };

    const clearSelections = () => {
        setSelectedExercises(new Map());
    };

    return {
        // Data
        fetchExercises,
        exercises: fetchExercises.data || [],
        isLoading: fetchExercises.isLoading,
        isError: fetchExercises.isError,

        // Actions
        toggleExerciseSelection,
        isSelected,
        addSelectedExercises,
        handleBackToEdit,
        clearSelections,

        // State
        selectedExercises,
        hasSelectedExercises: selectedExercises.size > 0,
    };
}