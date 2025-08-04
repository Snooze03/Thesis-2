// stepThree.jsx
"use client"

import { LoginLayout } from "@/layouts/login-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFormContext } from "react-hook-form";
import { InputError } from "@/components/ui/inputError";
import { formOptions } from "./signup-schema";

export function AdditionalInfo({ prevStep }) {
    const {
        register,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useFormContext();

    return (
        <LoginLayout>
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Additional Information</CardTitle>
                    <CardDescription>Step 3 of 3 - Create your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        {/* Medical Condition */}
                        <div className="flex flex-col gap-3">
                            <Label htmlFor="medicalCondition">
                                Do you have any existing medical conditions, injuries, or physical limitations?
                            </Label>
                            <Textarea
                                id="medicalCondition"
                                {...register("medicalCondition")}
                                placeholder="Please describe any medical conditions or leave blank if none"
                            />
                            {errors.medicalCondition && (
                                <InputError>
                                    {errors.medicalCondition.message}
                                </InputError>
                            )}
                        </div>

                        {/* Dietary Restrictions */}
                        <div className="flex flex-col gap-3">
                            <Label htmlFor="dietaryRestrictions">
                                Food allergies/dietary restrictions.
                            </Label>
                            <Textarea
                                id="dietaryRestrictions"
                                {...register("dietaryRestrictions")}
                                placeholder="Please describe any dietary restrictions or leave blank if none"
                            />
                            {errors.dietaryRestrictions && (
                                <InputError>
                                    {errors.dietaryRestrictions.message}
                                </InputError>
                            )}
                        </div>

                        {/* Workout Frequency */}
                        <div className="flex flex-col gap-3">
                            <Label>
                                How many days per week can you commit to a workout?
                            </Label>
                            <RadioGroup
                                value={watch("workoutFrequency")}
                                onValueChange={(val) => setValue("workoutFrequency", val)}
                                className="flex flex-col gap-3"
                            >
                                {formOptions.workoutFrequencies.map((frequency) => (
                                    <div key={frequency.value} className="flex items-center space-x-2">
                                        <RadioGroupItem value={frequency.value} id={frequency.id} />
                                        <Label htmlFor={frequency.id}>{frequency.label}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                            {errors.workoutFrequency && (
                                <InputError>
                                    {errors.workoutFrequency.message}
                                </InputError>
                            )}
                        </div>

                        {/* Workout Location */}
                        <div className="flex flex-col gap-3">
                            <Label>Where will you primarily workout?</Label>
                            <RadioGroup
                                value={watch("workoutLocation")}
                                onValueChange={(val) => setValue("workoutLocation", val)}
                                className="flex flex-col gap-3"
                            >
                                {formOptions.workoutLocations.map((location) => (
                                    <div key={location.value} className="flex items-center space-x-2">
                                        <RadioGroupItem value={location.value} id={location.id} />
                                        <Label htmlFor={location.id}>{location.label}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                            {errors.workoutLocation && (
                                <InputError>
                                    {errors.workoutLocation.message}
                                </InputError>
                            )}
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
                                type="submit"
                                className="flex-1"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Finishing..." : "Finish Signup"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </LoginLayout>
    );
}