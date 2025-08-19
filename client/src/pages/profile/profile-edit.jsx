"use client"

import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { formOptions } from "../sign-up/signup-schema";
import { MultiStepSchema, defaultFormValues, stepFields } from "../sign-up/signup-schema";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { SubLayout } from "@/layouts/sub-layout";
import { SectionTitle, SectionSubTitle } from "@/components/ui/section-title";
import { Card, CardContent, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputError } from "@/components/ui/inputError";
import { ArrowLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function ProfileEdit() {
    const navigate = useNavigate();

    return (
        <SubLayout>
            <div className="flex gap-2 items-center">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft className="size-5" />
                </Button>
                <SectionTitle>Edit</SectionTitle>
            </div>

            <UpdateBasicInfo />

            <UpdateAdditionalInfo />

        </SubLayout>
    );
}

function UpdateBasicInfo() {
    const {
        register,
        setValue,
        watch,
        trigger,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: valibotResolver(MultiStepSchema),
        defaultValues: defaultFormValues,
        mode: "onChange",
    });


    const handleSubmit = async (e) => {
        e.preventDefault();
        const fieldsToValidate = stepFields[2];
        // console.log(fieldsToValidate);
        const valid = await trigger(fieldsToValidate);
    };

    return (
        <>
            <SectionSubTitle>Basic Information</SectionSubTitle>

            <Card className="w-full h-full">
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className={cn(
                            "grid grid-rows-2 gap-3",
                            "max-xs:grid-rows-1",
                            "mt-1"
                        )}>
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current_weight">Current Weight</Label>
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
                                            placeholder="53"
                                            className="pr-12"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kgs</span>
                                    </div>
                                    {errors.goal_weight && (
                                        <InputError>
                                            {errors.goal_weight.message}
                                        </InputError>
                                    )}
                                </div>
                            </div>

                            <div className={cn(
                                "grid grid-cols-2 gap-4",
                                "max-xs:grid-cols-1 max-xs:grid-rows-2",
                            )}>
                                <div className="space-y-2">
                                    <Label htmlFor="height_ft">Height</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            id="height_ft"
                                            {...register("height_ft")}
                                            type="number"
                                            placeholder="5 ft"
                                        />
                                        <Input
                                            id="height_in"
                                            {...register("height_in")}
                                            type="number"
                                            placeholder="4 in"
                                        />
                                    </div>
                                    {(errors.height_ft || errors.height_in) && (
                                        <InputError>
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
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full mt-3"
                        >
                            {isSubmitting ? "Updating..." : "Update"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </>
    );
}

function UpdateAdditionalInfo() {
    const {
        register,
        setValue,
        watch,
        trigger,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: valibotResolver(MultiStepSchema),
        defaultValues: defaultFormValues,
        mode: "onChange",
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fieldsToValidate = stepFields[3];
        // console.log(fieldsToValidate);
        const valid = await trigger(fieldsToValidate);
    };

    return (
        <>
            <SectionSubTitle className="text-lg lg:text-xl font-bold">Additional Information</SectionSubTitle>
            <Card className="w-full max-w-lg">
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-4 mt-1">
                            {/* Medical Condition */}
                            <div className="flex flex-col gap-3">
                                <Label htmlFor="injuries">
                                    Do you have any existing medical conditions, injuries, or physical limitations?
                                </Label>
                                <Textarea
                                    id="injuries"
                                    {...register("injuries")}
                                    placeholder="Please describe any medical conditions or leave blank if none"
                                    className="max-sm:placeholder:text-xs"
                                />
                                {errors.injuries && (
                                    <InputError>
                                        {errors.injuries.message}
                                    </InputError>
                                )}
                            </div>

                            {/* Dietary Restrictions */}
                            <div className="flex flex-col gap-3">
                                <Label htmlFor="food_allergies">
                                    Food allergies/dietary restrictions.
                                </Label>
                                <Textarea
                                    id="food_allergies"
                                    {...register("food_allergies")}
                                    placeholder="Please describe any dietary restrictions or leave blank if none"
                                    className="max-sm:placeholder:text-xs"
                                />
                                {errors.food_allergies && (
                                    <InputError>
                                        {errors.food_allergies.message}
                                    </InputError>
                                )}
                            </div>

                            {/* Workout Frequency */}
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

                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Updating..." : "Update"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </>
    );
}