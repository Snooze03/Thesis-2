import * as v from "valibot";
import { formOptions } from "../../sign-up/signup-schema";

const BasicInformationSchema = v.object({
    starting_weight: v.pipe(
        v.string(),
        v.nonEmpty("Starting weight is required"),
        v.transform(Number),
        v.number("Must be a valid number"),
        v.minValue(20, "Weight must be at least 20 kg"),
        v.maxValue(500, "Weight must be less than 500 kg"),
    ),
    goal_weight: v.pipe(
        v.string(),
        v.nonEmpty("Goal weight is required"),
        v.transform(Number),
        v.number("Must be a valid number"),
        v.minValue(20, "Weight must be at least 20 kg"),
        v.maxValue(500, "Weight must be less than 500 kg")
    ),
    activity_level: v.pipe(
        v.string(),
        v.picklist(formOptions.activityLevel.map((a) => a.value), "Please select an activity level")
    ),
    body_goal: v.pipe(
        v.string(),
        v.picklist(formOptions.bodyGoals.map((b) => b.value), "Please select a body goal")
    ),
})

const AdditionalInformationSchema = v.object({
    injuries: v.pipe(
        v.string(),
        v.maxLength(500, "Injuries description must be less than 500 characters")
    ),
    food_allergies: v.pipe(
        v.string(),
        v.maxLength(500, "Food allergies description must be less than 500 characters")
    ),
    workout_frequency: v.pipe(
        v.string(),
        v.picklist(formOptions.workoutFrequencies.map((wf) => wf.value), "Please select workout frequency")
    ),
    workout_location: v.pipe(
        v.string(),
        v.picklist(formOptions.workoutLocations.map((loc) => loc.value), "Please select workout location")
    ),
})

export { BasicInformationSchema, AdditionalInformationSchema }