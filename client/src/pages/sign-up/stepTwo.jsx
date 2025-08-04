// stepTwo.jsx
"use client"

import { LoginLayout } from "@/layouts/login-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormContext } from "react-hook-form";
import { InputError } from "@/components/ui/inputError";
import { formOptions } from "./signup-schema";

export function BasicInfo({ nextStep, prevStep }) {
    const {
        register,
        setValue,
        watch,
        formState: { errors },
    } = useFormContext();

    return (
        <LoginLayout>
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Basic Information</CardTitle>
                    <CardDescription>Step 2 of 3 - Create your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="current_weight">Current Weight (kgs)</Label>
                                <div className="relative">
                                    <Input
                                        id="current_weight"
                                        {...register("current_weight")}
                                        type="number"
                                        placeholder="45"
                                        className="pr-12"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kgs</span>
                                </div>
                                {errors.current_weight && (
                                    <InputError className="mt-1">
                                        {errors.current_weight.message}
                                    </InputError>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="goal_weight">Goal Weight</Label>
                                <div className="relative">
                                    <Input
                                        id="goal_weight"
                                        {...register("goal_weight")}
                                        type="number"
                                        placeholder="53"
                                        className="pr-12"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kgs</span>
                                </div>
                                {errors.goal_weight && (
                                    <InputError className="mt-1">
                                        {errors.goal_weight.message}
                                    </InputError>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="height_ft">Height</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="height_ft"
                                        {...register("height_ft")}
                                        type="number"
                                        placeholder="5"
                                        className="flex-1"
                                    />
                                    <span className="flex items-center text-sm text-muted-foreground">ft</span>
                                    <Input
                                        id="height_in"
                                        {...register("height_in")}
                                        type="number"
                                        placeholder="4"
                                        className="flex-1"
                                    />
                                    <span className="flex items-center text-sm text-muted-foreground">in</span>
                                </div>
                                {(errors.height_ft || errors.height_in) && (
                                    <InputError className="mt-1">
                                        {errors.height_ft ? errors.height_ft.message : errors.height_in.message}
                                    </InputError>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="body_goal">Body Goal</Label>
                                <Select
                                    value={watch("body_goal")}
                                    onValueChange={(value) => setValue("body_goal", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select goal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {formOptions.bodyGoals.map((goal) => (
                                            <SelectItem key={goal.value} value={goal.value}>
                                                {goal.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.body_goal && (
                                    <InputError className="mt-1">
                                        {errors.body_goal.message}
                                    </InputError>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={prevStep}
                                className="flex-1"
                            >
                                Back
                            </Button>
                            <Button
                                type="button"
                                onClick={nextStep}
                                className="flex-1"
                            >
                                Continue
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </LoginLayout>
    );
}