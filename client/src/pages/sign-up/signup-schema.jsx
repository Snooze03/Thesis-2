// schemas/multi-step-form-schema.js
import * as v from "valibot";

// Combined Multi-Step Schema
export const MultiStepSchema = v.object({
    // Step 1 fields
    first_name: v.pipe(
        v.string(),
        v.nonEmpty("First name is required"),
        v.minLength(2, "First name must be at least 2 characters"),
    ),
    last_name: v.pipe(
        v.string(),
        v.nonEmpty("Last name is required"),
        v.minLength(2, "Last name must be at least 2 characters"),
    ),
    email: v.pipe(
        v.string(),
        v.nonEmpty("Email is required"),
        v.email("Enter a valid email address")
    ),
    password: v.pipe(
        v.string(),
        v.nonEmpty("Password is required"),
        v.minLength(8, "Must be at least 8 characters"),
        // v.regex(/(?=.*[a-z])/, "Password must contain at least one lowercase letter"),
        // v.regex(/(?=.*[A-Z])/, "Password must contain at least one uppercase letter"),
        // v.regex(/(?=.*\d)/, "Password must contain at least one number"),
    ),
    confirm_password: v.pipe(
        v.string(),
        v.nonEmpty("Please confirm your password")
    ),

    // Step 2 fields
    current_weight: v.pipe(
        v.string(),
        v.nonEmpty("Current weight is required"),
        v.transform(Number),
        v.number("Must be a valid number"),
        v.minValue(20, "Must be at least 20 kg"),
        v.maxValue(300, "Weight must be less than 300 kg")
    ),
    goal_weight: v.pipe(
        v.string(),
        v.nonEmpty("Goal weight is required"),
        v.transform(Number),
        v.number("Must be a valid number"),
        v.minValue(20, "Weight must be at least 20 kg"),
        v.maxValue(300, "Weight must be less than 300 kg")
    ),
    height_ft: v.pipe(
        v.string(),
        v.nonEmpty("Feet is required"),
        v.transform(Number),
        v.number("Must be a valid number"),
        v.minValue(3, "Feet must be at least 3 feet"),
        v.maxValue(8, "Feet must be less than 9 feet"),
    ),
    height_in: v.pipe(
        v.string(),
        v.nonEmpty("Inches is required"),
        v.transform(Number),
        v.number("Must be a valid number"),
        v.maxValue(11, "Inches must be less than 12"),
    ),
    body_goal: v.pipe(
        v.string(),
        v.nonEmpty("Select a body goal"),
        v.picklist(
            ["lose_weight", "gain_weight", "maintain_weight", "gain_muscle", "build_strength"],
            "Please select a valid body goal"
        )
    ),

    // Step 3 fields
    injuries: v.string(),
    food_allergies: v.string(),
    workout_frequency: v.pipe(
        v.string(),
        v.nonEmpty("Please select workout frequency"),
        v.picklist(["1_2", "3_4", "5_6"], "Please select a valid workout frequency")
    ),
    workout_location: v.pipe(
        v.string(),
        v.nonEmpty("Please select workout location"),
        v.picklist(["gym", "home", "mixed"], "Please select a valid workout location")
    ),
});

// Add password confirmation validation to the combined schema
export const ValidatedMultiStepSchema = v.pipe(
    MultiStepSchema,
    v.forward(
        v.partialCheck(
            [["password"], ["confirm_password"]],
            (input) => input.password === input.confirm_password,
            "Passwords do not match",
        ),
        ["confirm_password"],
    ),
);

// Default values for the form
export const defaultFormValues = {
    // Step 1
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",

    // Step 2
    current_weight: "",
    goal_weight: "",
    height_ft: "",
    height_in: "",
    body_goal: "",

    // Step 3
    injuries: "",
    food_allergies: "",
    workout_frequency: "",
    workout_location: "",
};

// Step field mappings for validation
export const stepFields = {
    1: ["first_name", "last_name", "email", "password", "confirm_password"],
    2: ["current_weight", "goal_weight", "height_ft", "height_in", "body_goal"],
    3: ["injuries", "food_allergies", "workout_frequency", "workout_location"]
};

// Form options for select/radio inputs
export const formOptions = {
    bodyGoals: [
        { value: "lose_weight", label: "Lose Weight" },
        { value: "gain_weight", label: "Gain Weight" },
        { value: "maintain_weight", label: "Maintain Weight" },
        { value: "gain_muscle", label: "Gain Muscle" },
        { value: "build_strength", label: "Build Strength" },
    ],
    workoutFrequencies: [
        { value: "1_2", label: "1-2 Days", id: "1-2-days" },
        { value: "3_4", label: "3-4 Days", id: "3-4-days" },
        { value: "5_6", label: "5-6 Days", id: "5-6-days" },
    ],
    workoutLocations: [
        { value: "gym", label: "Gym", id: "location-gym" },
        { value: "home", label: "Home", id: "location-home" },
        { value: "mixed", label: "Mixed", id: "location-mixed" },
    ],
};