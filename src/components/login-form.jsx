"use client"

import { Link } from "react-router"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { valibotResolver } from '@hookform/resolvers/valibot'
import { InputError } from "@/components/ui/inputError"
import { pipe, object, string, nonEmpty, email, safeParse } from "valibot"

// Prefix for Valibot
const v = {
  pipe,
  object,
  string,
  nonEmpty,
  email,
  safeParse,
}

// Schema for Login Form
const loginSchema = v.object({
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

export function LoginForm({
  className,
  ...props
}) {

  // React Form Hook
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: valibotResolver(loginSchema)
  });

  // Submit Handler
  const onSubmit = (data) => {
    const result = v.safeParse(loginSchema, data);
    console.log(result.success ? "Form Success!" : "Form Fail");
    console.log(data);
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col gap-6">

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email"{...register("email")} type="email" placeholder="myemail@gmail.com" />
                {/* Validation Error Message */}
                {errors.email && (
                  <InputError>
                    {errors.email.message}
                  </InputError>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline">
                    Forgot your password?
                  </a>
                </div>
                <Input id="password" {...register("password")} type="password" />
                {errors.password && (
                  <InputError>
                    {errors.password.message}
                  </InputError>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Logging in..." : "Login"}
                </Button>
              </div>
            </div>

            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link to={"/signup"} className="underline underline-offset-4">
                Sign up
              </Link>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
