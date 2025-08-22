import * as v from "valibot";

// Form options for select/radio inputs
export const formOptions = {
    genders: [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
        { value: "other", label: "Other" },
        { value: "prefer_not_to_say", label: "Prefer not to say" },
    ],
    activityLevel: [
        { value: "sedentary", label: "Sedentary (little/no exercise)" },
        { value: "lightly_active", label: "Lightly Active (light exercise 1-3 days/week)" },
        { value: "moderately_active", label: "Moderately Active (moderate exercise 3-5 days/week)" },
        { value: "very_active", label: "Very Active (hard exercise 6-7 days/week)" },
    ],
    bodyGoals: [
        { value: "lose_weight", label: "Lose Weight" },
        { value: "gain_weight", label: "Gain Weight" },
        { value: "maintain_weight", label: "Maintain Weight" },
        { value: "gain_muscle", label: "Gain Muscle" },
        { value: "build_strength", label: "Build Strength" },
    ],
    workoutFrequencies: [
        { value: "1_2", label: "1-2 Days per week", id: "1-2-days" },
        { value: "3_4", label: "3-4 Days per week", id: "3-4-days" },
        { value: "5_6", label: "5-6 Days per week", id: "5-6-days" },
        { value: "daily", label: "Daily", id: "daily" },
    ],
    workoutLocations: [
        { value: "gym", label: "Gym", id: "location-gym" },
        { value: "home", label: "Home", id: "location-home" },
        { value: "mixed", label: "Mixed", id: "location-mixed" },
    ],
};

export const MultiStepSchema = v.object({
    // Step 1 fields
    first_name: v.pipe(
        v.string(),
        v.nonEmpty("First name is required"),
        v.minLength(2, "First name must be at least 2 characters"),
        v.maxLength(150, "First name must be less than 150 characters"),
    ),
    last_name: v.pipe(
        v.string(),
        v.nonEmpty("Last name is required"),
        v.minLength(2, "Last name must be at least 2 characters"),
        v.maxLength(150, "Last name must be less than 150 characters"),
    ),
    email: v.pipe(
        v.string(),
        v.nonEmpty("Email is required"),
        v.email("Enter a valid email address"),
    ),
    password: v.pipe(
        v.string(),
        v.nonEmpty("Password is required"),
        v.minLength(8, "Must be at least 8 characters"),
    ),
    confirm_password: v.pipe(
        v.string(),
        v.nonEmpty("Please confirm your password")
    ),

    // Step 2 fields
    gender: v.pipe(
        v.string(),
        v.picklist(formOptions.genders.map((g) => g.value), "Please select a gender")
    ),
    activity_level: v.pipe(
        v.string(),
        v.picklist(formOptions.activityLevel.map((a) => a.value), "Please select an activity level")
    ),
    current_weight: v.pipe(
        v.string(),
        v.nonEmpty("Current weight is required"),
        v.transform(Number),
        v.number("Must be a valid number"),
        v.minValue(20, "Weight must be at least 20 kg"),
        v.maxValue(500, "Weight must be less than 500 kg")
    ),
    goal_weight: v.pipe(
        v.string(),
        v.nonEmpty("Goal weight is required"),
        v.transform(Number),
        v.number("Must be a valid number"),
        v.minValue(20, "Weight must be at least 20 kg"),
        v.maxValue(500, "Weight must be less than 500 kg")
    ),
    height_ft: v.pipe(
        v.string(),
        v.nonEmpty("Height in feet is required"),
        v.transform(Number),
        v.number("Must be a valid number"),
        v.minValue(3, "Height must be at least 3 feet"),
        v.maxValue(8, "Height must be less than 9 feet"),
    ),
    height_in: v.pipe(
        v.string(),
        v.nonEmpty("Height in inches is required"),
        v.transform(Number),
        v.number("Must be a valid number"),
        v.minValue(0, "Inches must be at least 0"),
        v.maxValue(11, "Inches must be less than 12"),
    ),
    body_goal: v.pipe(
        v.string(),
        v.picklist(formOptions.bodyGoals.map((b) => b.value), "Please select a body goal")
    ),

    // Step 3 fields (optional fields, so just validate length if provided)
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
});

// Default values for the form
export const defaultFormValues = {
    // Step 1
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",

    // Step 2
    gender: "",
    activity_level: "",
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
    2: ["gender", "activity_level", "current_weight", "goal_weight", "height_ft", "height_in", "body_goal"],
    3: ["injuries", "food_allergies", "workout_frequency", "workout_location"]
};