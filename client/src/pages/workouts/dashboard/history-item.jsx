import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { Separator } from "@/components/ui/separator";

// Conversion constant
const LBS_TO_KG = 0.453592;

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
    const formatTotalVolume = () => {
        const units = Object.keys(volumeData.unitCounts);

        if (units.length === 0) {
            return '0kg';
        }

        // If only one unit is used across all exercises
        if (units.length === 1) {
            const unit = units[0];
            const totalVolume = volumeData.exercises.reduce((sum, ex) => sum + ex.volume, 0);
            return `${totalVolume.toFixed(1)}${unit}`;
        }

        // If mixed units - convert everything to kg
        const totalVolumeInKg = volumeData.exercises.reduce((sum, ex) => {
            const volumeInKg = ex.unit === 'lbs'
                ? ex.volume * LBS_TO_KG
                : ex.volume;
            return sum + volumeInKg;
        }, 0);

        return `${totalVolumeInKg.toFixed(1)}kg`;
    };

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
                        <p className="text-lg font-bold text-gray-800">{formatTotalVolume()}</p>
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

                            return (
                                <div key={exercise.id} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">
                                        {index + 1}. {exercise.exercise_name}
                                    </span>
                                    <span className="text-gray-500 font-mono text-xs">
                                        {exercise.total_sets_performed} sets • {volume.toFixed(1)}{unit}
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