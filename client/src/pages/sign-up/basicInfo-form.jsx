"use client"

import { cn } from "@/lib/utils";
import { LoginLayout } from "@/layouts/login-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { InputError } from "@/components/ui/inputError";
import { BasicInfoSchema } from "@/pages/sign-up/signup-schema";

export function BasicInfo(
    className,
    ...props
) {
    // BasicInfo Form Validation
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: valibotResolver(BasicInfoSchema)
    });

    // Submit Handler
    const onSubmit = (data) => {
        console.log(`Form Success: ${data}`);
    }

    return (
        <LoginLayout>
            <div className={cn("flex flex-col gap-6", className)} {...props}>
                <Card className="w-full max-w-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Basic Information</CardTitle>
                        <CardDescription>Tell us about your fitness goals and current stats</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currentWeight">Current Weight (kgs)</Label>
                                    <div className="relative">
                                        <Input
                                            id="currentWeight"
                                            {...register("currentWeight")}
                                            type="number"
                                            placeholder="45" className="pr-12"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kgs</span>
                                    </div>
                                    {errors.currentWeight && (
                                        <InputError className="mt-1">
                                            {errors.currentWeight.message}
                                        </InputError>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="goalWeight">Goal Weight</Label>
                                    <div className="relative">
                                        <Input
                                            id="goalWeight"
                                            {...register("goalWeight")}
                                            type="number"
                                            placeholder="53" className="pr-12"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kgs</span>
                                    </div>
                                    {errors.goalWeight && (
                                        <InputError className="mt-1">
                                            {errors.goalWeight.message}
                                        </InputError>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="height">Height</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="heightFeet"
                                            {...register("heightFeet")}
                                            type="number"
                                            placeholder="5" className="flex-1"
                                        />
                                        <span className="flex items-center text-sm text-muted-foreground">ft</span>
                                        <Input
                                            id="heightInches"
                                            {...register("heightInches")}
                                            type="number"
                                            placeholder="4" className="flex-1"
                                        />
                                        <span className="flex items-center text-sm text-muted-foreground">in</span>
                                    </div>
                                    {(errors.heightFeet || errors.heightInches) && (
                                        <InputError className="mt-1">
                                            {errors.heightFeet ? errors.heightFeet.message : errors.heightInches.message}
                                        </InputError>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bodyGoal">Body Goal</Label>
                                    <Select >
                                        <SelectTrigger  {...register("bodyGoal")}>
                                            <SelectValue placeholder="Select goal" />
                                        </SelectTrigger>
                                        <SelectContent >
                                            <SelectItem value="lose-weight">Lose Weight</SelectItem>
                                            <SelectItem value="gain-weight">Gain Weight</SelectItem>
                                            <SelectItem value="maintain">Maintain Weight</SelectItem>
                                            <SelectItem value="gain-muscle">Gain Muscle</SelectItem>
                                            <SelectItem value="strength">Build Strength</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.bodyGoal && (
                                        <InputError className="mt-1">
                                            {errors.bodyGoal.message}
                                        </InputError>
                                    )}
                                </div>
                            </div>

                            <Button type="submit" className="w-full">
                                Continue
                            </Button>

                        </form>
                    </CardContent>
                </Card>

            </div>
        </LoginLayout>
    );
}