import { atom } from "jotai";

// Search Atoms
export const searchTermAtom = atom("");
export const selectedExercisesAtom = atom(new Map());

// Template Atoms
export const templateTitleAtom = atom("");
export const exerciseConfigsAtom = atom(new Map());

// Template Edit state
export const isEditingTemplateAtom = atom(false);