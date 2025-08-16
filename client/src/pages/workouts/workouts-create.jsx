"use client"

import { useState, useEffect } from "react";
import api from "@/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { X, FlagTriangleRight, Plus } from "lucide-react";
import { SubLayout } from "@/layouts/sub-layout";
import { ExerciseCard } from "./exercise-card";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyItems } from "@/components/empty-items";

function CreateTemplate() {
    const navigate = useNavigate();
    const { template_id } = useParams();                // Get template_id from URL if editing existing
    const [title, setTitle] = useState("");
    const [localTitle, setLocalTitle] = useState("");   // For local input changes

    // Check if we're editing an existing template or creating new
    const isEditing = Boolean(template_id);

    // ===== GET EXISTING TEMPLATE (if editing) =====
    const getTemplate = async () => {
        if (!template_id) return null;
        const response = await api.get(`workouts/templates/${template_id}/`);
        return response.data;
    };

    const {
        data: existingTemplate,
        isLoading: isLoadingTemplate
    } = useQuery({
        queryKey: ["template_exercises_edit", template_id],
        queryFn: getTemplate,
        enabled: isEditing,
        onSuccess: (data) => {
            if (data) {
                setTitle(data.title);
                setLocalTitle(data.title);
            }
        }
    });
    // ===== END GET EXISTING =====

    // ===== GET TEMPLATE EXERCISES =====
    const getTemplateExercises = async () => {
        if (!template_id) return [];
        const response = await api.get(`workouts/templates/${template_id}/exercises/`);
        return response.data;
    };

    const {
        data: exercises = [],
        isLoading: isLoadingExercises,
        refetch: refetchExercises
    } = useQuery({
        queryKey: ["template_exercises", template_id],
        queryFn: getTemplateExercises,
        enabled: isEditing,
        // Refetch when the component becomes visible again (user navigates back)
        refetchOnWindowFocus: true,
        // Keep data fresh
        staleTime: 0
    });
    // ===== END GET EXERCISES =====

    // ===== POST/UPDATE TEMPLATE =====
    const createTemplate = async (template_title) => {
        // If were not editing
        const response = await api.post("workouts/templates/", { title: template_title });
        return response.data;
    }

    const updateTemplate = async ({ id, title }) => {
        // If were editing
        const response = await api.patch(`workouts/templates/${id}/`, { title });
        return response.data;
    };

    const {
        data: template,
        mutate: saveTemplate,
        isLoading: isSaving
    } = useMutation({
        mutationFn: isEditing ? updateTemplate : createTemplate,
        onSuccess: (templateData) => {
            if (isEditing) {
                setTitle(templateData.title);
                navigate("/workouts");
                toast.success("Template updated successfully!");
            } else {
                // Navigate to the search section with the new template ID
                navigate(`/workouts/templates/${templateData.id}/search`);
            }
        },
        onError: (error) => {
            toast.error(`Error: ${error.response?.data?.message || error.message}`);
        }
    });
    // ===== END POST/UPDATE =====


    // ===== SYNC LOCAL TITLE WITH FETCHED TEMPLATE =====
    useEffect(() => {
        if (existingTemplate && !localTitle) {
            setLocalTitle(existingTemplate.title);
            setTitle(existingTemplate.title);
        }
    }, [existingTemplate, localTitle]);
    // ===== END SYNC LOCAL =====

    // ===== EVENT HANDLERS =====
    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            saveTemplate({ id: template_id, title: localTitle });
        } else {
            saveTemplate(localTitle);
        }
    }

    const handleAddExercise = () => {
        // If we're creating a new template and don't have a template_id yet
        if (!isEditing && !localTitle.trim()) {
            return toast.error("Enter a template title first");
        }

        if (!isEditing) {
            // Create template first, then navigate
            saveTemplate(localTitle);
        } else {
            // Navigate to search with existing template_id
            navigate(`/workouts/templates/${template_id}/search`);
        }
    }

    const handleCancel = async () => {
        try {
            if ((exercises.length === 0) && (isEditing)) {
                await new Promise((resolve) => setTimeout(resolve, 350));
                await api.delete(`workouts/templates/${template_id}/`);
            }
        }
        catch (err) {
            console.log(err);
        }
        finally {
            navigate("/workouts");
        }
    }
    // ===== END EVENT HANDLERS =====

    // Show loading state for existing template
    if (isEditing && isLoadingTemplate) {
        return (
            <SubLayout>
                <LoadingSpinner message="template" />
            </SubLayout>
        );
    }

    // Main View
    return (
        <SubLayout>
            {/* Header */}
            <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                {/* Alert Dialog for closing/cancelling */}
                <AlertDialog>
                    <AlertDialogTrigger>
                        <X />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {isEditing ? "Cancel Template Editing?" : "Cancel Template Creation?"}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you absolutely sure? Any unsaved changes will be lost.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleCancel}
                                className={buttonVariants({ variant: "destructive" })}
                            >
                                Continue
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <form onSubmit={handleSubmit} className="grid grid-cols-[1fr_auto] gap-2">
                    {/* Template title input */}
                    <Input
                        type="text"
                        id="template_title"
                        value={localTitle}
                        onChange={(e) => setLocalTitle(e.target.value)}
                        variant="ghost"
                        className="h-7"
                        placeholder={isEditing ? "Template Name" : "New Workout Template"}
                        disabled={isSaving}
                    />

                    <Button
                        type="submit"
                        className="h-7 ml-3"
                        disabled={isSaving || !localTitle.trim() || exercises.length === 0}
                    >
                        <FlagTriangleRight />
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                </form>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-3">
                {/* Show exercises if editing or if there are no exercises */}
                {(isEditing || exercises.length === 0) && (
                    <div className="flex flex-col gap-2">
                        {isLoadingExercises ? (
                            <LoadingSpinner message="exercises" />
                        ) : exercises.length > 0 ? (
                            <>
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-sm text-gray-700">
                                        Exercises ({exercises.length})
                                    </h3>
                                </div>
                                <div className="space-y-4">
                                    {exercises.map((templateExercise) => (
                                        <div key={templateExercise.id} className="relative group">
                                            <ExerciseCard
                                                template_Id={template_id}
                                                template_exercise_id={templateExercise.exercise.id}
                                                exercise={templateExercise.exercise.name}
                                                equipment={templateExercise.exercise.equipment}
                                                muscle={templateExercise.exercise.muscle}
                                                difficulty={templateExercise.exercise.difficulty}
                                                sets={templateExercise.sets}
                                                reps={templateExercise.reps}
                                                weight={templateExercise.weight}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <EmptyItems
                                title="No exercises added yet"
                                description="Click 'Add Exercises' to get started!"
                            />
                        )}
                    </div>
                )}

                {/* Add Exercise Button */}
                <Button
                    className="bg-white text-primary font-semibold border-2 border-dashed border-primary/30 hover:bg-primary/10"
                    onClick={handleAddExercise}
                    disabled={isSaving}
                >
                    <Plus className="w-4 h-4 mr-1" />
                    ADD EXERCISE
                </Button>
            </div>
        </SubLayout>
    );
}

export { CreateTemplate }