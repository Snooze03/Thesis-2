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
import { cn } from "@/lib/utils";

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
                    <CardDescription>Step 2 of 3 - Tell us about yourself</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className={cn(
                        "grid grid-rows-3 gap-4",
                        "max-xs:grid-rows-4"
                    )}>
                        {/* Gender and Activity Level Row */}
                        <div className={cn(
                            "grid grid-cols-2 gap-4",
                            "max-xs:grid-cols-1 max-xs:grid-rows-2",
                        )}>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select
                                    value={watch("gender")}
                                    onValueChange={(value) => setValue("gender", value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {formOptions.genders.map((gender) => (
                                            <SelectItem key={gender.value} value={gender.value}>
                                                {gender.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.gender && (
                                    <InputError>
                                        {errors.gender.message}
                                    </InputError>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="activity_level">Activity Level</Label>
                                <Select
                                    value={watch("activity_level")}
                                    onValueChange={(value) => setValue("activity_level", value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {formOptions.activityLevel.map((lvl) => (
                                            <SelectItem key={lvl.value} value={lvl.value}>
                                                {lvl.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.activity_level && (
                                    <InputError>
                                        {errors.activity_level.message}
                                    </InputError>
                                )}
                            </div>
                        </div>

                        {/* Weight Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="current_weight">Current Weight</Label>
                                <div className="relative">
                                    <Input
                                        id="current_weight"
                                        {...register("current_weight")}
                                        type="number"
                                        placeholder="70"
                                        className="pr-12"
                                        min="20"
                                        max="500"
                                        step="0.1"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kg</span>
                                </div>
                                {errors.current_weight && (
                                    <InputError>
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
                                        placeholder="65"
                                        className="pr-12"
                                        min="20"
                                        max="500"
                                        step="0.1"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kg</span>
                                </div>
                                {errors.goal_weight && (
                                    <InputError>
                                        {errors.goal_weight.message}
                                    </InputError>
                                )}
                            </div>
                        </div>

                        {/* Height and Body Goal Row */}
                        <div className={cn(
                            "grid grid-cols-2 gap-4",
                            "max-xs:grid-cols-1 max-xs:grid-rows-2",
                        )}>
                            <div className="space-y-2">
                                <Label>Height</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="relative">
                                        <Input
                                            id="height_ft"
                                            {...register("height_ft")}
                                            type="number"
                                            placeholder="5"
                                            className="pr-8"
                                            min="3"
                                            max="8"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ft</span>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="height_in"
                                            {...register("height_in")}
                                            type="number"
                                            placeholder="8"
                                            className="pr-8"
                                            min="0"
                                            max="11"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">in</span>
                                    </div>
                                </div>
                                {(errors.height_ft || errors.height_in) && (
                                    <InputError>
                                        {errors.height_ft?.message || errors.height_in?.message}
                                    </InputError>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="body_goal">Primary Goal</Label>
                                <Select
                                    value={watch("body_goal")}
                                    onValueChange={(value) => setValue("body_goal", value)}
                                >
                                    <SelectTrigger className="w-full">
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
                                    <InputError>
                                        {errors.body_goal.message}
                                    </InputError>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={prevStep}
                        >
                            Back
                        </Button>
                        <Button
                            type="button"
                            onClick={nextStep}
                        >
                            Continue
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </LoginLayout>
    );
}