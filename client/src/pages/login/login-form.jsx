"use client"

import { useMutation } from "@tanstack/react-query";
import api from "@/api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants";
import { Link, useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { LoginLayout } from "@/layouts/login-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { LoginSchema } from "./login-schema";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { safeParse } from "valibot";
import { InputError } from "@/components/ui/inputError";

export function Login({
  className,
  ...props
}) {
  const navigate = useNavigate();

  // React Form Hook
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: valibotResolver(LoginSchema)
  });

  // Makes a post request, to check if user exist, if true, update access and refresh tokens
  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: async (data) => {
      const response = await api.post("accounts/token/", data);
      localStorage.setItem(ACCESS_TOKEN, response.data.access);
      localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
    },
    onSuccess: () => {
      navigate("/");
    }
  });

  // Submit Handler
  const onSubmit = (data) => {
    mutate(data);
  }

  return (
    <LoginLayout>
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
                  <Input
                    id="email"
                    {...register("email")}
                    type="email"
                    placeholder="myemail@gmail.com"
                  />
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
                  <Input
                    id="password"
                    {...register("password")}
                    type="password"
                  />
                  {errors.password && (
                    <InputError>
                      {errors.password.message}
                    </InputError>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Logging in..." : "Login"}
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
    </LoginLayout>
  );
}
