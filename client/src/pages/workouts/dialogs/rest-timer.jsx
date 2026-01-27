import { useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { RadialProgress } from "@/components/ui/radial-progress";
import { AlarmClock } from "lucide-react";
import { useAtom } from "jotai";
import { restTimerAtom } from "../create/template-atoms";
import { formatTime } from "../utils/formatTime";

export function RestTimerDialog({ isOpen, onOpenChange }) {
    const [restTimer, setRestTimer] = useAtom(restTimerAtom);

    // ===== REST TIMER COUNTDOWN EFFECT =====
    useEffect(() => {
        let intervalId;

        if (restTimer.isActive && restTimer.remainingSeconds > 0) {
            intervalId = setInterval(() => {
                setRestTimer(prev => {
                    const newRemaining = prev.remainingSeconds - 1;

                    if (newRemaining <= 0) {
                        return {
                            isActive: false,
                            remainingSeconds: 0,
                            exerciseName: null,
                            exerciseMuscle: null,
                            totalSeconds: 0
                        };
                    }

                    return {
                        ...prev,
                        remainingSeconds: newRemaining
                    };
                });
            }, 1000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [restTimer.isActive, restTimer.remainingSeconds, setRestTimer]);

    // Format time for display (MM:SS)
    const restTime = formatTime(restTimer.remainingSeconds);

    // Skip rest timer
    const skipRestTimer = useCallback(() => {
        setRestTimer({
            isActive: false,
            remainingSeconds: 0,
            exerciseName: null,
            exerciseMuscle: null,
            totalSeconds: 0
        });
    }, [setRestTimer]);

    // Add 15 seconds to timer
    const addTimeToTimer = useCallback(() => {
        setRestTimer(prev => ({
            ...prev,
            remainingSeconds: prev.remainingSeconds + 15
        }));
    }, [setRestTimer]);
    // ===== END REST TIMER EFFECTS =====

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <button className="px-3 py-1 flex items-center gap-2 bg-green-100 rounded-full text-green-700">
                    <AlarmClock className="size-4" />
                    <p className="text-sm">{restTime}</p>
                </button>
            </DialogTrigger>
            <DialogContent className="w-auto min-w-60 gap-4">
                <DialogHeader className="gap-4">
                    <DialogTitle className="text-center">Resting</DialogTitle>
                    <DialogDescription />

                    <div className="flex justify-center items-center">
                        <RadialProgress
                            value={restTimer.remainingSeconds}
                            max={restTimer.totalSeconds}
                            size="xl"
                            showValue={false}
                            className="[&_circle:first-child]:text-green-100 [&_circle:last-child]:text-green-300"
                        >
                            <div className="flex flex-col items-center">
                                <span className="text-3xl font-bold text-green-300 tabular-nums">
                                    {restTime}
                                </span>
                                <span className="text-xs text-muted-foreground mt-1">remaining</span>
                            </div>
                        </RadialProgress>
                    </div>
                </DialogHeader>
                <div className="flex gap-3 justify-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={addTimeToTimer}
                    >
                        +15s
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={skipRestTimer}
                    >
                        Skip Rest
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}