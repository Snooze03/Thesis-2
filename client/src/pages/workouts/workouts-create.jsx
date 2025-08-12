"use client"

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

    const handleCancel = () => {
        navigate(-1);
    }

    return (
        <SubLayout>
            {/* Header */}
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
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

                {/* For changing template name */}
                <Input variant="ghost" placeholder="New Workout Template" className="h-7"></Input>

                <Button className="h-7 ml-3">
                    <FlagTriangleRight />
                    Save
                </Button>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-3">
                <ExerciseCard />
                <ExerciseCard />
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