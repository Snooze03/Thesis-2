import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KebabMenu } from "@/components/ui/kebab-menu";
import { Plus, Trash2, AlarmClock, Replace, Minus, Lock } from "lucide-react";
import * as v from "valibot";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useForm } from "react-hook-form";


function ExerciseCard() {
    const [weight, setWeight] = useState(0);
    const [reps, setReps] = useState(0);
    const [isDone, setIsDone] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: valibotResolver(ExerciseSchema)
    });

    const menuItems = [
        { icon: Plus, label: "Add Set", action: "add_set" },
        { icon: Trash2, label: "Delete Set", action: "delete_set" },
        { icon: AlarmClock, label: "Rest Timer", action: "set_restTimer" },
        { icon: Replace, label: "Replace Exercise", action: "change_exercise" },
        { icon: Minus, label: "Remove Exercise", variant: "destructive", action: "remove_exercise" },
    ]

    return (
        <Card className="px-5 py-3 gap-2">
            {/* Header */}
            <div>
                <div className="flex justify-between items-center gap-3">
                    <p className="font-semibold">Bench Press</p>
                    <KebabMenu items={menuItems} />
                </div>
                <p className="-mt-2 text-gray-600">Barbell</p>
            </div>

            {/* Properties */}
            <div className="grid grid-flow-col auto-cols-auto gap-3">
                <PropertyContainer>
                    <p>Sets</p>
                    <p className="text-primary font-semibold">1</p>
                    <p className="text-primary font-semibold">2</p>
                </PropertyContainer>

                <PropertyContainer>
                    <p>Previous</p>
                    <p className="text-gray-600 ">30kg x 10</p>
                    <p className="text-gray-600 ">30kg x 10</p>
                </PropertyContainer>

                <PropertyContainer>
                    <p>Weight</p>
                    <Input
                        id={`weight_${1}`}
                        {...register("weight")}
                        className="size-5 w-full px-2 text-center"
                        type="number"
                    />
                    <Input
                        id={`weight_${2}`}
                        {...register("weight")}
                        className="size-5 w-full px-2 text-center"
                        type="number"
                    />
                </PropertyContainer>

                <PropertyContainer>
                    <p>Reps</p>
                    <Input
                        id={`rep_${1}`}
                        {...register("repetitions")}
                        className="size-5 w-full px-2 text-center"
                        type="number"
                    />
                    <Input
                        id={`rep_${2}`}
                        {...register("repetitions")}
                        className="size-5 w-full px-2 text-center"
                        type="number"
                    />
                </PropertyContainer>

                <PropertyContainer>
                    <br />
                    <Lock className="text-gray-600 size-4" />
                    <Lock className="text-gray-600 size-4" />
                </PropertyContainer>
            </div>

        </Card>
    );
}

// Container for sets, weight etc
function PropertyContainer({ children }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2">
            {children}
            {/* Adds additional space below */}
            <span className="block" />
        </div>
    );
}

const ExerciseSchema = v.object({
    weight: v.pipe(
        v.string(),
        v.nonEmpty("Weight is empty"),
        v.transform(Number),
        v.number("Enter a valid number"),
    ),
    repetitions: v.pipe(
        v.string(),
        v.nonEmpty("Reps is empty"),
        v.transform(Number),
        v.number("Enter a valid number"),
    )
})

export { ExerciseCard }