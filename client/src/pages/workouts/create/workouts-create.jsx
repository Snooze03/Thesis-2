import { X, FlagTriangleRight, Plus } from "lucide-react";
import { SubLayout } from "@/layouts/sub-layout";
import { ExerciseCard } from "./exercise-card";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyItems } from "@/components/empty-items";
import { useTemplateActions } from "@/hooks/workouts/useTemplateActions";
import { useTemplateExercises } from "@/hooks/workouts/useTemplateExercises";

function CreateTemplate() {
    const {
        localTitle,
        setLocalTitle,
        isEditing,
        existingTemplate,
        isLoadingTemplate,
        isSaving,
        handleSubmit,
        handleAddExercise,
        handleCancel,
    } = useTemplateActions();

    const {
        exercises,
        isLoading: isLoadingExercises,
    } = useTemplateExercises(isEditing ? existingTemplate?.id : null);

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
                                                template_exercise={templateExercise}
                                                isEditing={isEditing}
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