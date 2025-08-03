import * as v from "valibot";

const SignUpSchema = v.pipe(
    v.object({
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
        ),
        confirmPassword: v.pipe(
            v.string(),
            v.nonEmpty("Please confirm your password")
        ),
    }),
    v.forward(
        v.partialCheck(
            [["password"], ["confirmPassword"]],
            (input) => input.password === input.confirmPassword,
            "Passwords do not match",
        ),
        ["confirmPassword"],
    ),
);

const BasicInfoSchema = v.object(
    {
        currentWeight: v.pipe(
            v.string(),
            v.nonEmpty("Current weight is required"),
            v.transform(Number),
            v.number("Must be a valid number"),
            v.minValue(1, "Weight must be greater than 0")
        ),
        goalWeight: v.pipe(
            v.string(),
            v.nonEmpty("Goal weight is required"),
            v.transform(Number),
            v.number("Must be a valid number"),
            v.minValue(1, "Weight must be greater than 0")
        ),
        heightFeet: v.pipe(
            v.string(),
            v.nonEmpty("Ft is required"),
            v.transform(Number),
            v.number("Must be a valid number"),
            v.minValue(1, "Height must be at least 1 foot"),
            v.maxValue(8, "Height must be less than 8 feet"),
        ),
        heightInches: v.pipe(
            v.string(),
            v.nonEmpty("Inches is required"),
            v.transform(Number),
            v.number("Must be a valid number"),
            v.minValue(0, "Inches must be 1 or greater"),
            v.maxValue(11, "Inches must be less than 12"),
        ),
        bodyGoal: v.pipe(
            v.string(),
            v.nonEmpty("Please select a body goal"),
        )
    }
);

export {
    SignUpSchema,
    BasicInfoSchema,
}
