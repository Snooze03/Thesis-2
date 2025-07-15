import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { valibotResolver } from '@hookform/resolvers/valibot'
import { signUpSchema } from "../schemas/signup-schema"

export function SignUpForm(
    className,
    ...props
) {

    // React Form Hook
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: valibotResolver(signUpSchema)
    });

    // Submit Handler
    const onSubmit = (data) => {
        console.log(`Form Success: ${data}`);
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                    <CardDescription>Enter your information below to create your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First name</Label>
                                    <Input id="firstName" {...register("firstName")} placeholder="John" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last name</Label>
                                    <Input id="lastName" {...register("lastName")} placeholder="Doe" required />
                                </div>
                            </div>
                            {(errors.firstName || errors.lastName) && (
                                <div className="col-span-2 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                    {errors.firstName ? errors.firstName.message : errors.lastName.message}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" {...register("email")} type="email" placeholder="john.doe@example.com" required />
                                {errors.email && (
                                    <div className="mt-1 col-span-2 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                        {errors.email.message}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" {...register("password")} type="password" placeholder="Create a strong password" required />
                                {errors.password && (
                                    <div className="mt-1 col-span-2 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                        {errors.password.message}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm password</Label>
                                <Input id="confirmPassword" {...register("confirmPassword")} type="password" placeholder="Confirm your password" required />
                                {errors.confirmPassword && (
                                    <div className="mt-1 col-span-2 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                        {errors.confirmPassword.message}
                                    </div>
                                )}
                            </div>
                            <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
                                {isSubmitting ? "Creating Account..." : "Create Account"}
                            </Button>
                            <div className="text-center text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <a href="#" className="underline underline-offset-4 hover:text-primary">
                                    Sign in
                                </a>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
