"use client"

import { useState } from "react";
import api from "@/api";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { X, FlagTriangleRight } from "lucide-react";
import { SubLayout } from "@/layouts/sub-layout";
import { ExerciseCard } from "./exercise-card";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "react-hot-toast";

// Main function
function CreateTemplate() {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");

    // ===== POST TEMPLATE =====
    const createTemplate = async () => {
        const response = await api.post("workouts/templates/", { title: title });
        // Returns the data of the newly created template
        return response.data;
    }

    const {
        data: template,
        mutate,
        isLoading: isSaving
    } = useMutation({
        mutationFn: createTemplate,
        onSuccess: (template) => {
            navigate(`${location.pathname}/search/${template.id}`);
        },
        onError: (error) => {
            toast.error(`Error: ${error.message}`);
        }
    })
    // ===== END POST =====

    // ===== ON CLICK HANDLERS =====
    const handleSubmit = (e) => {
        e.preventDefault();
        mutate();
    }

    const handleAddExercise = () => {
        if (!title.trim()) {
            return toast.error("Enter a template title first");
        }
        mutate();
    }

    const handleCancel = () => {
        navigate(-1);
    }
    // ===== END ONCLICK =====

    return (
        <SubLayout>
            {/* Header */}
            <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                {/* Alert Dialog for closing/cancelling the creation */}
                <AlertDialog>
                    <AlertDialogTrigger>
                        <X />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Template Creation?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you absolutely sure? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleCancel}
                                className={buttonVariants(
                                    { variant: "destructive" }
                                )}
                            >Continue
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <form onSubmit={handleSubmit} className="grid grid-cols-[1fr_auto] gap-2">
                    {/* For changing template name */}
                    <Input
                        type="text"
                        id="template_title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        variant="ghost"
                        className="h-7"
                        placeholder="New Workout Template"
                        disabled={isSaving}
                    />

                    <Button
                        type="submit"
                        className="h-7 ml-3"
                        disabled={isSaving || !title.trim()}
                    >
                        <FlagTriangleRight />
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                </form>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-3">
                {/* {exercises.map((exercise, index) => (
                    <ExerciseCard
                        key={exercise.name + index}
                        exercise={exercise.name}
                        equipment={exercise.equipment}
                    />
                ))} */}
                <Button
                    variant="ghost"
                    className="text-primary font-semibold"
                    onClick={handleAddExercise}
                >
                    ADD EXERCISE
                </Button>
            </div>
        </SubLayout>
    );
}

export { CreateTemplate }