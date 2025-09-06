import * as v from "valibot";
import { formOptions } from "../../sign-up/signup-schema";

const EditSchema = v.object({
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

export { EditSchema, defaultEditValues }