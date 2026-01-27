import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { Separator } from "@/components/ui/separator";
import { formatTotalVolume } from "../utils/formatTotalVolume";

// Individual workout history items
export function HistoryItem({ workout }) {
    // Calculate total volume and track units used
    const volumeData = workout.performed_exercises?.reduce((acc, exercise) => {
        const unit = exercise.weight_unit || 'kg';
        const volume = exercise.total_volume || 0;

        acc.exercises.push({ unit, volume });

        if (!acc.unitCounts[unit]) {
            acc.unitCounts[unit] = 0;
        }
        acc.unitCounts[unit]++;

        return acc;
    }, { exercises: [], unitCounts: {} }) || { exercises: [], unitCounts: {} };

    // Format total volume display
    const totalVolume = formatTotalVolume(volumeData);

    return (
        <Card>
            <CardContent className="space-y-3">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <h3 className="font-semibold text-lg">{workout.template_title}</h3>
                        <div className="flex flex-row items-center gap-1 text-gray-600">
                            <Calendar className="size-3" />
                            <p className="text-sm">
                                {formatDate(workout.completed_at)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-primary-200 rounded-full">
                        <Clock className="size-3" />
                        <p className="text-sm font-medium text-gray-600">
                            {workout.duration_minutes} min
                        </p>
                    </div>
                </div>

                {/* Workout Stats */}
                <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="py-1 text-center bg-purple-200 rounded-md">
                        <p className="text-lg font-bold text-gray-800">{workout.total_exercises}</p>
                        <p className="text-xs ">Exercises</p>
                    </div>
                    <div className="py-1 text-center bg-green-200 rounded-md">
                        <p className="text-lg font-bold text-gray-800">{workout.total_sets}</p>
                        <p className="text-xs">Sets</p>
                    </div>
                    <div className="py-1 text-center bg-orange-200 rounded-md">
                        <p className="text-lg font-bold text-gray-800">{totalVolume}</p>
                        <p className="text-xs">Volume</p>
                    </div>
                </div>

                <Separator />

                {/* Exercises Summary */}
                <div className="space-y-2">
                    <h4 className="text-sm font-bold">Exercises Performed</h4>
                    <div className="space-y-1">
                        {workout.performed_exercises?.map((exercise, index) => {
                            const unit = exercise.weight_unit || 'kg';
                            const volume = exercise.total_volume || 0;
                            { console.log(exercise); }

                            return (
                                <div key={exercise.id} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">
                                        {index + 1}. {exercise.exercise_name}
                                    </span>
                                    <span className="text-gray-500 font-mono text-xs">
                                        {exercise.total_sets_performed} sets
                                        {exercise.set_type === 'weight_reps' && ` • ${volume.toFixed(1)}${unit}`}
                                        {exercise.set_type === 'reps_only' && exercise.formatted_sets_display && ` • ${exercise.formatted_sets_display}`}
                                        {exercise.set_type === 'duration' && exercise.formatted_sets_display && ` • ${exercise.formatted_sets_display}`}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}