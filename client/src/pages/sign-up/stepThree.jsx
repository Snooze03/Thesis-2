import { LoginLayout } from "@/layouts/login-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFormContext } from "react-hook-form";
import { InputError } from "@/components/ui/inputError";
import { formOptions } from "./signup-schema";

export function AdditionalInfo({ prevStep, isSubmitting }) {
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
                    <CardTitle className="text-lg lg:text-xl font-bold">Additional Information</CardTitle>
                    <CardDescription className="-mb-2 -mt-1">Step 3 of 3 - Complete your profile</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        {/* Injuries */}
                        <div className="flex flex-col gap-3">
                            <Label htmlFor="injuries">
                                Do you have any injuries or physical limitations?
                            </Label>
                            <Textarea
                                id="injuries"
                                {...register("injuries")}
                                placeholder="Describe any injuries or limitations (optional)"
                                className="min-h-[80px] resize-none"
                            />
                            {errors.injuries && (
                                <InputError>
                                    {errors.injuries.message}
                                </InputError>
                            )}
                        </div>

                        {/* Food Allergies */}
                        <div className="flex flex-col gap-3">
                            <Label htmlFor="food_allergies">
                                Do you have any food allergies or dietary restrictions?
                            </Label>
                            <Textarea
                                id="food_allergies"
                                {...register("food_allergies")}
                                placeholder="List any allergies or restrictions (optional)"
                                className="min-h-[80px] resize-none"
                            />
                            {errors.food_allergies && (
                                <InputError>
                                    {errors.food_allergies.message}
                                </InputError>
                            )}
                        </div>


                        {/* Workout Frequency - KEEP AS STRING */}
                        <div className="flex flex-col gap-3">
                            <Label>
                                How many days per week can you commit to a workout?
                            </Label>
                            <RadioGroup
                                value={watch("workout_frequency")}
                                onValueChange={(val) => setValue("workout_frequency", val)}
                                className="flex flex-col gap-3"
                            >
                                {formOptions.workoutFrequencies.map((frequency) => (
                                    <div key={frequency.value} className="flex items-center space-x-2">
                                        <RadioGroupItem value={frequency.value} id={frequency.id} />
                                        <Label htmlFor={frequency.id}>{frequency.label}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                            {errors.workout_frequency && (
                                <InputError>
                                    {errors.workout_frequency.message}
                                </InputError>
                            )}
                        </div>

                        {/* Workout Location */}
                        <div className="flex flex-col gap-3">
                            <Label>Where will you primarily workout?</Label>
                            <RadioGroup
                                value={watch("workout_location")}
                                onValueChange={(val) => setValue("workout_location", val)}
                                className="flex flex-col gap-3"
                            >
                                {formOptions.workoutLocations.map((location) => (
                                    <div key={location.value} className="flex items-center space-x-2">
                                        <RadioGroupItem value={location.value} id={location.id} />
                                        <Label htmlFor={location.id}>{location.label}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                            {errors.workout_location && (
                                <InputError>
                                    {errors.workout_location.message}
                                </InputError>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={prevStep}
                                disabled={isSubmitting}
                            >
                                Back
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Creating Account..." : "Create Account"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </LoginLayout>
    );
}