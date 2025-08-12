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

// Main function
function CreateTemplate() {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");

    const createTemplate = async (template_title) => {
        const post = await api.post("workouts/templates/", { title: template_title });
    }

    const mutation = useMutation({
        mutationFn: createTemplate,
        onSuccess: () => {
            navigate(-1);
        },
        onError: (error) => {
            alert(`Error: ${error.message}`);
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(title);
    }

    const handleCancel = () => {
        navigate(-1);
    }

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
                    />

                    <Button
                        type="submit"
                        className="h-7 ml-3"
                    >
                        <FlagTriangleRight />
                        Save
                    </Button>
                </form>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-3">
                {/* <ExerciseCard />
                <ExerciseCard /> */}
                <Button
                    variant="ghost"
                    className="text-primary font-semibold"
                    onClick={() => navigate(`${location.pathname}/search`)}
                >
                    ADD EXERCISE
                </Button>
            </div>
        </SubLayout>
    );
}

export { CreateTemplate }