// stepOne.jsx
"use client"

import { Link } from "react-router";
import { LoginLayout } from "@/layouts/login-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormContext } from "react-hook-form";
import { InputError } from "@/components/ui/inputError";

export function SignUp({ nextStep }) {
    const {
        register,
        formState: { errors },
    } = useFormContext();

    return (
        <LoginLayout>
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                    <CardDescription>Step 1 of 3 - Create your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First name</Label>
                                <Input
                                    id="firstName"
                                    {...register("firstName")}
                                    type="text"
                                    placeholder="John"
                                />
                                {errors.firstName && (
                                    <InputError>
                                        {errors.firstName.message}
                                    </InputError>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last name</Label>
                                <Input
                                    id="lastName"
                                    {...register("lastName")}
                                    type="text"
                                    placeholder="Doe"
                                />
                                {errors.lastName && (
                                    <InputError>
                                        {errors.lastName.message}
                                    </InputError>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                {...register("email")}
                                type="email"
                                placeholder="john.doe@example.com"
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
                            />
                            {errors.password && (
                                <InputError>
                                    {errors.password.message}
                                </InputError>
                            )}
                            {/* <div className="text-xs text-muted-foreground">
                                Password must contain uppercase, lowercase, and a number
                            </div> */}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm password</Label>
                            <Input
                                id="confirmPassword"
                                {...register("confirmPassword")}
                                type="password"
                                placeholder="Confirm your password"
                            />
                            {errors.confirmPassword && (
                                <InputError>
                                    {errors.confirmPassword.message}
                                </InputError>
                            )}
                        </div>

                        <Button
                            type="button"
                            onClick={nextStep}
                            className="w-full mt-2"
                        >
                            Continue
                        </Button>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link to={"/login"} className="underline underline-offset-4 hover:text-primary" >
                                Sign in
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </LoginLayout>
    );
}