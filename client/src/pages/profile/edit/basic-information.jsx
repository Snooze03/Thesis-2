"use client"

import api from "@/api";
import { BasicInformationSchema } from "../schema/edit-schema";
import { formOptions } from "@/pages/sign-up/signup-schema";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SectionSubTitle } from "@/components/ui/section-title";
import { InputError } from "@/components/ui/inputError";
import { cn } from "@/lib/utils";

export function UpdateBasicInfo({ userData }) {
    const queryClient = useQueryClient();
    const userProfile = userData.profile;
    const [isUpdating, setIsUpdating] = useState(false);

    const {
        handleSubmit,
        register,
        setValue,
        watch,
        formState: { errors, dirtyFields }
    } = useForm({
        resolver: valibotResolver(BasicInformationSchema),
        defaultValues: {
            starting_weight: userProfile.starting_weight || "",
            goal_weight: userProfile.goal_weight || "",
            activity_level: userProfile.activity_level || "",
            body_goal: userProfile.body_goal || "",
        },
        mode: "onChange",
    });

    const {
        mutate,
        isPending,
    } = useMutation({
        mutationFn: async (data) => {
            const response = await api.patch(`accounts/profiles/${userData.id}/`, data);
            return response.data;
        },
        onSuccess: (data) => {
            console.log(`Profile updated successfully! ${data}`);
            queryClient.invalidateQueries({ queryKey: ["account_data", "account_data_fallback"] });
        },
        onError: (error) => {
            console.error(`Error updating profile: ${error}`);
        }
    })

    const onSubmit = async (data) => {
        // Create an object with only the changed fields
        const transformedData = Object.keys(dirtyFields).reduce((acc, field) => {
            if (field === 'starting_weight' || field === 'goal_weight') {
                acc[field] = Number(data[field]);
            } else {
                acc[field] = data[field];
            }
            return acc;
        }, {});

        // Update date only if starting weight changed
        if (dirtyFields.starting_weight) {
            const currentDate = new Date().toISOString().split('T')[0];
            transformedData.start_weight_date = currentDate;
        }

        // Only mutate if there are actual changes
        if (Object.keys(transformedData).length > 0) {
            mutate(transformedData);
        } else {
            console.log("No changes detected");
        }

        setIsUpdating(false);
    };

    return (
        <>
            <SectionSubTitle>Basic Information</SectionSubTitle>

            <Card className="w-full h-full">
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)}>
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
                                    <Label htmlFor="starting_weight">Starting Weight</Label>
                                    <div className="relative">
                                        <Input
                                            id="starting_weight"
                                            {...register("starting_weight")}
                                            type="number"
                                            disabled={!isUpdating}
                                            className="pr-12"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kgs</span>
                                    </div>
                                    {errors.starting_weight && (
                                        <InputError>
                                            {errors.starting_weight.message}
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
                                            disabled={!isUpdating}
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
                                    <Label htmlFor="activity_level">Activity Level</Label>
                                    <Select
                                        value={watch("activity_level")}
                                        onValueChange={(value) => setValue("activity_level", value, { shouldDirty: true })}
                                        disabled={!isUpdating}
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

                                <div className="space-y-2">
                                    <Label htmlFor="body_goal">Body Goal</Label>
                                    <Select
                                        value={watch("body_goal")}
                                        onValueChange={(value) => setValue("body_goal", value, { shouldDirty: true })}
                                        disabled={!isUpdating}
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
                        <AlertUpdate
                            isUpdating={isUpdating}
                            setIsUpdating={setIsUpdating}
                            isPending={isPending}
                            onSubmit={handleSubmit(onSubmit)}
                        />
                    </form>
                </CardContent>
            </Card>
        </>
    );
}

function AlertUpdate({ isUpdating, setIsUpdating, isPending, onSubmit }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    type="button"
                    disabled={isPending}
                    className="w-full mt-3"
                >
                    {isPending ? "Updating..." : isUpdating ? "Save Changes" : "Edit"}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {isUpdating ? "Save changes?" : "Enable Editing?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {isUpdating
                            ? "Are you sure you want to save these changes? This action cannot be undone."
                            : "Are you sure you want to edit your information? Any changes made will affect calorie and macro calculations."
                        }
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        onClick={() => {
                            setIsUpdating(false);
                        }}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            if (isUpdating) {
                                onSubmit();
                            } else {
                                setIsUpdating(true);
                            }
                        }}>
                        {isUpdating ? "Save Changes" : "Enable Editing"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}