import { atom } from "jotai";

// Search Atoms
export const searchTermAtom = atom("");
export const selectedExercisesAtom = atom(new Map());

// Template Atoms
export const templateIdAtom = atom(null);
export const isAlternativeAtom = atom(false);
export const templateTitleAtom = atom("");
export const exerciseConfigsAtom = atom(new Map());

// Template Edit state
export const templateModeAtom = atom("create"); // "create" / "edit" / "start"

// Start Template atom
export const startedAtAtom = atom(null);
export const completedAtAtom = atom(null);

// Rest time atom
export const exerciseRestTimesAtom = atom(new Map());

// Rest timer countdown atom
export const restTimerAtom = atom({
    isActive: false,
    remainingSeconds: 0,
    exerciseName: null,
    exerciseMuscle: null,
    totalSeconds: 0
});

// Weight Unit Atom - tracks weight unit preference per exercise
// Structure: Map<exerciseKey, "kg" | "lbs">
// exerciseKey format: "${exercise.name}_${exercise.muscle}"
export const exerciseWeightUnitsAtom = atom(new Map());