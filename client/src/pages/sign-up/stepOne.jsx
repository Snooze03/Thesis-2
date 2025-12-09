import { Link } from "react-router";
import { LoginLayout } from "@/layouts/login-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormContext } from "react-hook-form";
import { InputError } from "@/components/ui/inputError";

export function SignUp({ nextStep, isRequesting }) {
    const {
        register,
        formState: { errors },
    } = useFormContext();

    return (
        <LoginLayout>
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Create an account</CardTitle>
                    <CardDescription>Step 1 of 3 - Basic account information</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">First name</Label>
                                <Input
                                    id="first_name"
                                    {...register("first_name")}
                                    type="text"
                                    placeholder="John"
                                    maxLength={150}
                                    disabled={isRequesting}
                                />
                                {errors.first_name && (
                                    <InputError>
                                        {errors.first_name.message}
                                    </InputError>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last name</Label>
                                <Input
                                    id="last_name"
                                    {...register("last_name")}
                                    type="text"
                                    placeholder="Doe"
                                    maxLength={150}
                                    disabled={isRequesting}
                                />
                                {errors.last_name && (
                                    <InputError>
                                        {errors.last_name.message}
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
                                disabled={isRequesting}
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
                                disabled={isRequesting}
                            />
                            {errors.password && (
                                <InputError>
                                    {errors.password.message}
                                </InputError>
                            )}
                            <div className="text-xs text-muted-foreground">
                                Password must be at least 8 characters long
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm_password">Confirm password</Label>
                            <Input
                                id="confirm_password"
                                {...register("confirm_password")}
                                type="password"
                                placeholder="Confirm your password"
                                disabled={isRequesting}
                            />
                            {errors.confirm_password && (
                                <InputError>
                                    {errors.confirm_password.message}
                                </InputError>
                            )}
                        </div>

                        <Button
                            type="button"
                            onClick={nextStep}
                            className="w-full mt-2"
                            disabled={isRequesting}
                        >
                            {isRequesting ? "Sending verification code..." : "Continue"}
                        </Button>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link to={"/login"} className="@max-2xs/card:block underline underline-offset-4 hover:text-primary">
                                Sign in
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </LoginLayout>
    );
}