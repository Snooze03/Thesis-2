import { atom } from "jotai";

export const searchTermAtom = atom("");
export const selectedExercisesAtom = atom(new Map());

export const exerciseConfigsAtom = atom(new Map());