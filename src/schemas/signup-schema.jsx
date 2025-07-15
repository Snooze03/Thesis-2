import { valibotResolver } from '@hookform/resolvers/valibot'
import {
    pipe,
    object,
    string,
    nonEmpty,
    email,
    safeParse,
    maxLength,
    minLength,
    forward,
    partialCheck
} from "valibot"

// Prefix for Valibot
const v = {
    pipe,
    object,
    string,
    nonEmpty,
    email,
    safeParse,
    maxLength,
    minLength,
    forward,
    partialCheck
}

const signUpSchema = v.pipe(
    v.object({
        firstName: v.pipe(
            v.string(),
            v.nonEmpty("Enter first name"),
            v.minLength(2, "First name must be at least 2 characters long"),
        ),
        lastName: v.pipe(
            v.string(),
            v.nonEmpty("Enter last name"),
            v.minLength(2, "Last name must be at least 2 characters long"),
        ),
        email: v.pipe(
            v.string(),
            v.nonEmpty("Email is required"),
            v.email("Please enter a valid email address")
        ),
        password: v.pipe(
            v.string(),
            v.nonEmpty("Password is required"),
            v.minLength(8, "Password must be at least 8 characters long"),
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
)

export {
    signUpSchema
}
