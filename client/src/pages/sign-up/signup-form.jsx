"use client"

import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { LoginLayout } from "@/layouts/login-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { SignUpSchema } from "@/pages/sign-up/signup-schema";
import { InputError } from "@/components/ui/inputError";
import { useState } from "react";

export function SignUp(
    className,
    ...props
) {
    // Signup Form Validation
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: valibotResolver(SignUpSchema)
    });

    // Submit Handler
    const onSubmit = (data) => {
        console.log(`Form Success: ${data}`);
    }

    return (
        <LoginLayout>

            <div className={cn("flex flex-col gap-6", className)} {...props}>
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                        <CardDescription>Step 1 of 3 - Create your account</CardDescription>
                    </CardHeader>
                    <CardContent>

                        <form onSubmit={handleSubmit(onSubmit)} noValidate>

                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First name</Label>
                                        <Input
                                            id="firstName"
                                            {...register("firstName")}
                                            type="text"
                                            placeholder="John"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last name</Label>
                                        <Input
                                            id="lastName"
                                            {...register("lastName")}
                                            type="text"
                                            placeholder="Doe"
                                            required
                                        />
                                    </div>
                                </div>

                                {(errors.firstName || errors.lastName) && (
                                    <InputError className="m-none">
                                        {errors.firstName ? errors.firstName.message : errors.lastName.message}
                                    </InputError>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        {...register("email")}
                                        type="email"
                                        placeholder="john.doe@example.com"
                                        required
                                    />
                                    {errors.email && (
                                        <InputError>
                                            {errors.email.message}
                                        </InputError>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        {...register("password")}
                                        type="password"
                                        placeholder="Create a strong password"
                                        required
                                    />
                                    {errors.password && (
                                        <InputError>
                                            {errors.password.message}
                                        </InputError>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm password</Label>
                                    <Input
                                        id="confirmPassword"
                                        {...register("confirmPassword")}
                                        type="password"
                                        placeholder="Confirm your password"
                                        required
                                    />
                                    {errors.confirmPassword && (
                                        <InputError>
                                            {errors.confirmPassword.message}
                                        </InputError>
                                    )}
                                </div>

                                <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
                                    {isSubmitting ? "Next Step..." : "Continue"}
                                </Button>

                                <div className="text-center text-sm text-muted-foreground">
                                    Already have an account?{" "}
                                    <Link to={"/"} className="underline underline-offset-4 hover:text-primary" >
                                        Sign in
                                    </Link>
                                </div>
                            </div>

                        </form>
                    </CardContent>
                </Card>
            </div>
        </LoginLayout>
    );
}