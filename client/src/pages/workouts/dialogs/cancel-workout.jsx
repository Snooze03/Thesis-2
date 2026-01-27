import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { CircleX } from "lucide-react";

export function CancelWorkoutDialog({ action }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    className="w-full bg-white text-destructive font-semibold border-2 border-dashed border-destructive/30 hover:bg-destructive/10"
                >
                    <CircleX className="size-4" />
                    CANCEL WORKOUT
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Cancel Workout Session?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to cancel this workout? All your progress will be lost and cannot be recovered.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Keep Working Out</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={action}
                        className={buttonVariants({ variant: "destructive" })}
                    >
                        Cancel Workout
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}