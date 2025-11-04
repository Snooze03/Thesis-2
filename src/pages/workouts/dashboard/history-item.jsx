import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { Separator } from "@/components/ui/separator";

// Individual workout history items
export function HistoryItem({ workout }) {
    // Calculate total volume across all exercises
    const totalVolume = workout.performed_exercises?.reduce((total, exercise) => {
        return total + (exercise.total_volume || 0);
    }, 0) || 0;

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
                        <p className="text-lg font-bold text-gray-800">{totalVolume}kg</p>
                        <p className="text-xs">Volume</p>
                    </div>
                </div>

                <Separator />

                {/* Exercises Summary */}
                <div className="space-y-2">
                    <h4 className="text-sm font-bold">Exercises Performed</h4>
                    <div className="space-y-1">
                        {workout.performed_exercises?.map((exercise, index) => (
                            <div key={exercise.id} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">
                                    {index + 1}. {exercise.exercise_name}
                                </span>
                                <span className="text-gray-500 font-mono text-xs">
                                    {exercise.total_sets_performed} sets • {exercise.total_volume}kg
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}