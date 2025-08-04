// schemas/multi-step-form-schema.js
import * as v from "valibot";

// Combined Multi-Step Schema
export const MultiStepSchema = v.object({
    // Step 1 fields
    firstName: v.pipe(
        v.string(),
        v.nonEmpty("First name is required"),
        v.minLength(2, "First name must be at least 2 characters"),
    ),
    lastName: v.pipe(
        v.string(),
        v.nonEmpty("Last name is required"),
        v.minLength(2, "Last name must be at least 2 characters"),
    ),
    email: v.pipe(
        v.string(),
        v.nonEmpty("Email is required"),
        v.email("Please enter a valid email address")
    ),
    password: v.pipe(
        v.string(),
        v.nonEmpty("Password is required"),
        v.minLength(8, "Password must be at least 8 characters"),
        // v.regex(/(?=.*[a-z])/, "Password must contain at least one lowercase letter"),
        // v.regex(/(?=.*[A-Z])/, "Password must contain at least one uppercase letter"),
        // v.regex(/(?=.*\d)/, "Password must contain at least one number"),
    ),
    confirmPassword: v.pipe(
        v.string(),
        v.nonEmpty("Please confirm your password")
    ),

    // Step 2 fields
    currentWeight: v.pipe(
        v.string(),
        v.nonEmpty("Current weight is required"),
        v.transform(Number),
        v.number("Must be a valid number"),
        v.minValue(20, "Weight must be at least 20 kg"),
        v.maxValue(300, "Weight must be less than 300 kg")
    ),
    goalWeight: v.pipe(
        v.string(),
        v.nonEmpty("Goal weight is required"),
        v.transform(Number),
        v.number("Must be a valid number"),
        v.minValue(20, "Weight must be at least 20 kg"),
        v.maxValue(300, "Weight must be less than 300 kg")
    ),
    heightFeet: v.pipe(
        v.string(),
        v.nonEmpty("Feet is required"),
        v.transform(Number),
        v.number("Must be a valid number"),
        v.minValue(3, "Height must be at least 3 feet"),
        v.maxValue(8, "Height must be less than 9 feet"),
    ),
    heightInches: v.pipe(
        v.string(),
        v.nonEmpty("Inches is required"),
        v.transform(Number),
        v.number("Must be a valid number"),
        v.minValue(0, "Inches must be 0 or greater"),
        v.maxValue(11, "Inches must be less than 12"),
    ),
    bodyGoal: v.pipe(
        v.string(),
        v.nonEmpty("Please select a body goal"),
        v.picklist(
            ["lose-weight", "gain-weight", "maintain", "gain-muscle", "strength"],
            "Please select a valid body goal"
        )
    ),

    // Step 3 fields
    medicalCondition: v.string(),
    dietaryRestrictions: v.string(),
    workoutFrequency: v.pipe(
        v.string(),
        v.nonEmpty("Please select workout frequency"),
        v.picklist(["1_2", "3_4", "5_6"], "Please select a valid workout frequency")
    ),
    workoutLocation: v.pipe(
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
            [["password"], ["confirmPassword"]],
            (input) => input.password === input.confirmPassword,
            "Passwords do not match",
        ),
        ["confirmPassword"],
    ),
);

// Default values for the form
export const defaultFormValues = {
    // Step 1
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",

    // Step 2
    currentWeight: "",
    goalWeight: "",
    heightFeet: "",
    heightInches: "",
    bodyGoal: "",

    // Step 3
    medicalCondition: "",
    dietaryRestrictions: "",
    workoutFrequency: "",
    workoutLocation: "",
};

// Step field mappings for validation
export const stepFields = {
    1: ["firstName", "lastName", "email", "password", "confirmPassword"],
    2: ["currentWeight", "goalWeight", "heightFeet", "heightInches", "bodyGoal"],
    3: ["medicalCondition", "dietaryRestrictions", "workoutFrequency", "workoutLocation"]
};

// Form options for select/radio inputs
export const formOptions = {
    bodyGoals: [
        { value: "lose-weight", label: "Lose Weight" },
        { value: "gain-weight", label: "Gain Weight" },
        { value: "maintain", label: "Maintain Weight" },
        { value: "gain-muscle", label: "Gain Muscle" },
        { value: "strength", label: "Build Strength" },
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