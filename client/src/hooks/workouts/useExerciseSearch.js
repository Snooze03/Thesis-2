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
    const [selectedItems, setSelectedItems] = useState(new Set());

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

            setSelectedItems(new Set());
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

    const handleSearch = (e) => {
        e.preventDefault();
        setSubmittedSearchTerm(searchTerm);
    };

    const addSelectedExercises = () => {
        if (selectedItems.size === 0) return;

        const exercises = exerciseQuery.data || [];
        const selectedExercises = exercises
            .map((exercise, index) => ({ exercise, originalIndex: index }))
            .filter(({ originalIndex }) =>
                selectedItems.has(exercises[originalIndex].name + originalIndex)
            )
            .map(({ exercise }) => exercise);

        const exercisesToAdd = selectedExercises.map(exercise => ({
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
        selectedItems,
        hasSelectedItems: selectedItems.size > 0,
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
        handleSearch,
        addSelectedExercises,
        handleBackToEdit,
    };
}