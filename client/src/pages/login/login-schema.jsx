import { pipe, object, string, nonEmpty, email, safeParse } from "valibot";

// Prefix for Valibot
const v = { pipe, object, string, nonEmpty, email, safeParse }

// Schema for Login Form
export const LoginSchema = v.object({
    email: v.pipe(
        v.string(),
        v.nonEmpty("Please enter your email"),
        v.email("Enter a valid email address"),
    ),
    password: v.pipe(
        v.string(),
        v.nonEmpty("Please enter your password")
    )
});