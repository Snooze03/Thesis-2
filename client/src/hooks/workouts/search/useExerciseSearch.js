import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { selectedExercisesAtom } from "@/pages/workouts/create/template-atoms";
import { useAtom } from "jotai";
import apiNinjas from "@/apiNinjas";

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
    const toggleExerciseSelection = (exercise) => {
        // Use exercise name as unique key (or a combination if names might not be unique)
        const exerciseKey = `${exercise.name}_${exercise.muscle || 'no_muscle'}`;

        setSelectedExercises(prev => {
            const newMap = new Map(prev);
            if (newMap.has(exerciseKey)) {
                newMap.delete(exerciseKey);
            } else {
                // Add exercise with default sets_data structure
                const exerciseWithDefaults = {
                    ...exercise,
                    sets_data: [
                        { reps: null, weight: null },
                    ],
                    rest_time: null,
                    notes: ""
                };
                newMap.set(exerciseKey, exerciseWithDefaults);
            }
            return newMap;
        });
    };

    const isSelected = (exercise) => {
        const exerciseKey = `${exercise.name}_${exercise.muscle || 'no_muscle'}`;
        return selectedExercises.has(exerciseKey);
    };

    const addSelectedExercises = () => {
        if (selectedExercises.size === 0) return;

        // Convert Map values to array with proper sets_data structure
        const exercisesToAdd = Array.from(selectedExercises.values()).map(exercise => ({
            name: exercise.name || '',
            type: exercise.type || '',
            muscle: exercise.muscle || '',
            equipment: exercise.equipment || '',
            difficulty: exercise.difficulty || '',
            instructions: exercise.instructions || '',
            sets_data: exercise.sets_data || [
                { reps: null, weight: null },
            ],
            rest_time: exercise.rest_time || null,
            notes: exercise.notes || ""
        }));

        console.log('Selected exercises to add:', exercisesToAdd);

        // Navigate back to create page
        navigate("/workouts/templates");
    };

    const handleBackToEdit = () => {
        navigate("/workouts/templates");
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