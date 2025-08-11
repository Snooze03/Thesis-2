import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge";
import { Button } from "../../components/ui/button";
import { Play, Trash2, Pencil } from "lucide-react";

function WorkoutTemplate({
    id,
    title,
    workouts,
}) {
    return (

        <AccordionItem value={`item-${id}`} className="shadow-sm rounded-lg">
            <AccordionTrigger>
                {title}
                <Badge>
                    {workouts} workouts
                </Badge>
            </AccordionTrigger>
            <AccordionContent className="px-5 py-4 space-y-3">

                {/* Exercises, to loop over with backend */}
                <div className="grid grid-cols-[min-content_auto] gap-3">
                    <div className="grid place-items-center size-10 bg-primary-300 rounded-full">
                        <p>3x</p>
                    </div>
                    <div className="flex flex-col justify-center">
                        <p>Bench Press</p>
                        <p className="text-gray-500">Barbell</p>
                    </div>
                </div>

                <div className="grid grid-cols-[min-content_auto] gap-3">
                    <div className="grid place-items-center size-10 bg-primary-300 rounded-full">
                        <p>3x</p>
                    </div>
                    <div className="flex flex-col justify-center">
                        <p>Lateral Raise</p>
                        <p className="text-gray-500">Dumbell</p>
                    </div>
                </div>

                {/* Button Controls */}
                <div className="grid grid-cols-[auto_auto_auto] gap-3 mt-5">
                    <Button variant="delete" size="sm">
                        <Trash2 className="size-3" />
                        Delete
                    </Button>
                    <Button variant="edit" size="sm">
                        <Pencil className="size-3" />
                        Edit
                    </Button>
                    <Button size="sm">
                        <Play className="size-3" />
                        Start Workout
                    </Button>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}

function CreateWorkoutTemplate() {
    return (
        <>
        </>
    );
}

export { WorkoutTemplate, CreateWorkoutTemplate }