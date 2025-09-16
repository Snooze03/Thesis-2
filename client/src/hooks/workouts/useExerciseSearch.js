import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import api from "@/api";
import apiNinjas from "@/apiNinjas";
import { toast } from "react-hot-toast";

export function useExerciseSearch() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState("");
    const [submittedSearchTerm, setSubmittedSearchTerm] = useState("");
    //  Store actual exercise objects instead of just IDs
    const [selectedExercises, setSelectedExercises] = useState(new Map());

    // Get template from navigation state
    const { template } = location.state || {};
    const templateId = template?.id;

    // Redirect if no template state is provided
    useEffect(() => {
        if (!template) {
            navigate("/workouts", { replace: true });
        }
    }, [template, navigate]);

    // Get exercises from Ninja API
    const getExercises = async ({ queryKey }) => {
        const [_, searchName] = queryKey;
        if (searchName) {
            const response = await apiNinjas.get(`exercises?name=${searchName}`);
            return response.data;
        } else {
            const response = await apiNinjas.get(`exercises?difficulty=beginner`);
            return response.data;
        }
    };

    const exerciseQuery = useQuery({
        queryKey: ["search_exercises", submittedSearchTerm],
        queryFn: getExercises,
        staleTime: Infinity,
        cacheTime: Infinity,
    });

    // Add exercises to template
    const addExercisesToTemplate = async ({ templateId, exercises }) => {
        const response = await api.post(
            `workouts/templates/${templateId}/add_exercises/`,
            { exercises: exercises }
        );
        return response.data;
    };

    const addExercisesMutation = useMutation({
        mutationFn: addExercisesToTemplate,
        onSuccess: (data) => {
            const successCount = data.created?.length || 0;
            const errorCount = data.errors?.length || 0;

            if (errorCount > 0) {
                if (data.errors) {
                    console.log('Exercise addition issues:', data.errors);
                    data.errors.forEach(error => {
                        if (error.error !== 'Exercise already exists in this template') {
                            console.error(`Issue with ${error.exercise}:`, error.error);
                        }
                        if (error.error === 'Exercise already exists in this template') {
                            toast.error(`Exercise already exists!`);
                        }
                    });
                }
            }

            // Clear selections after successful addition
            setSelectedExercises(new Map());
            navigate("/workouts/templates/edit", {
                state: {
                    template,
                    mode: "edit"
                }
            });
        },
        onError: (error) => {
            console.error('Error adding exercises:', error);
            toast.error(`Error adding exercises: ${error.response?.data?.error || error.message}`);
        }
    });

    // Helper functions
    const toggleItemSelection = (exercise, index) => {
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
        return selectedExercises.has(exerciseKey);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setSubmittedSearchTerm(searchTerm);
        // Note: We don't clear selections on search - they persist across searches
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

        addExercisesMutation.mutate({
            templateId: templateId,
            exercises: exercisesToAdd
        });
    };

    const handleBackToEdit = () => {
        navigate("/workouts/templates/edit", {
            state: {
                template,
                mode: "edit"
            }
        });
    };

    return {
        // State
        searchTerm,
        setSearchTerm,
        selectedExercises,
        hasSelectedItems: selectedExercises.size > 0,
        template,
        templateId,

        // Query data
        exercises: exerciseQuery.data || [],
        isLoading: exerciseQuery.isPending,
        isError: exerciseQuery.isError,

        // Mutation state
        isAdding: addExercisesMutation.isLoading,

        // Actions
        toggleItemSelection,
        isSelected,
        handleSearch,
        addSelectedExercises,
        handleBackToEdit,
    };
}