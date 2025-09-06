"use client"

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api";
import { cn } from "@/lib/utils";
import { EditSchema } from "../schema/edit-schema";
import { formOptions } from "../../sign-up/signup-schema";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { SubLayout } from "@/layouts/sub-layout";
import { SectionTitle, SectionSubTitle } from "@/components/ui/section-title";
import { Card, CardContent, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { InputError } from "@/components/ui/inputError";
import { ArrowLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function ProfileEdit() {
    const navigate = useNavigate();
    const location = useLocation();

    // Get data from navigation state if available
    const passedUserData = location.state?.userData;

    const {
        data: user_data = [],
        isPending,
    } = useQuery({
        queryKey: ["account_data_fallback"],
        queryFn: async () => {
            const response = await api.get("accounts/profiles/");
            return response.data;
        },
        enabled: !passedUserData, // Only run this query if no data was passed
    });

    // used passed data if available, otherwise fallback to fetched data
    const userData = passedUserData || user_data;

    if (!passedUserData && isPending) return <div>Loading...</div>;

    return (
        <SubLayout>
            <div className="flex gap-2 items-center">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft className="size-5" />
                </Button>
                <SectionTitle>Edit</SectionTitle>
            </div>

            <UpdateBasicInfo userData={userData} />

            {/* <UpdateAdditionalInfo /> */}

        </SubLayout>
    );
}

function UpdateBasicInfo({ userData }) {
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
        resolver: valibotResolver(EditSchema),
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
        const transformedData = {
            starting_weight: Number(watch("starting_weight")),
            goal_weight: Number(watch("goal_weight")),
            activity_level: watch("activity_level"),
            body_goal: watch("body_goal"),
        };

        // Update date only if starting weight changed
        if (dirtyFields.starting_weight) {
            const currentDate = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
            transformedData.start_weight_date = currentDate;
        }

        mutate(transformedData)
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
                                        onValueChange={(value) => setValue("activity_level", value)}
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
                                        onValueChange={(value) => setValue("body_goal", value)}
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

// function UpdateAdditionalInfo() {
//     const {
//         register,
//         setValue,
//         watch,
//         trigger,
//         formState: { errors, isSubmitting }
//     } = useForm({
//         resolver: valibotResolver(MultiStepSchema),
//         defaultValues: defaultFormValues,
//         mode: "onChange",
//     });

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         const fieldsToValidate = stepFields[3];
//         // console.log(fieldsToValidate);
//         const valid = await trigger(fieldsToValidate);
//     };

//     return (
//         <>
//             <SectionSubTitle className="text-lg lg:text-xl font-bold">Additional Information</SectionSubTitle>
//             <Card className="w-full max-w-lg">
//                 <CardContent>
//                     <form onSubmit={handleSubmit}>
//                         <div className="flex flex-col gap-4 mt-1">
//                             {/* Medical Condition */}
//                             <div className="flex flex-col gap-3">
//                                 <Label htmlFor="injuries">
//                                     Do you have any existing medical conditions, injuries, or physical limitations?
//                                 </Label>
//                                 <Textarea
//                                     id="injuries"
//                                     {...register("injuries")}
//                                     placeholder="Please describe any medical conditions or leave blank if none"
//                                     className="max-sm:placeholder:text-xs"
//                                 />
//                                 {errors.injuries && (
//                                     <InputError>
//                                         {errors.injuries.message}
//                                     </InputError>
//                                 )}
//                             </div>

//                             {/* Dietary Restrictions */}
//                             <div className="flex flex-col gap-3">
//                                 <Label htmlFor="food_allergies">
//                                     Food allergies/dietary restrictions.
//                                 </Label>
//                                 <Textarea
//                                     id="food_allergies"
//                                     {...register("food_allergies")}
//                                     placeholder="Please describe any dietary restrictions or leave blank if none"
//                                     className="max-sm:placeholder:text-xs"
//                                 />
//                                 {errors.food_allergies && (
//                                     <InputError>
//                                         {errors.food_allergies.message}
//                                     </InputError>
//                                 )}
//                             </div>

//                             {/* Workout Frequency */}
//                             <div className="flex flex-col gap-3">
//                                 <Label>
//                                     How many days per week can you commit to a workout?
//                                 </Label>
//                                 <RadioGroup
//                                     value={watch("workout_frequency")}
//                                     onValueChange={(val) => setValue("workout_frequency", val)}
//                                     className="flex flex-col gap-3"
//                                 >
//                                     {formOptions.workoutFrequencies.map((frequency) => (
//                                         <div key={frequency.value} className="flex items-center space-x-2">
//                                             <RadioGroupItem value={frequency.value} id={frequency.id} />
//                                             <Label htmlFor={frequency.id}>{frequency.label}</Label>
//                                         </div>
//                                     ))}
//                                 </RadioGroup>
//                                 {errors.workout_frequency && (
//                                     <InputError>
//                                         {errors.workout_frequency.message}
//                                     </InputError>
//                                 )}
//                             </div>

//                             {/* Workout Location */}
//                             <div className="flex flex-col gap-3">
//                                 <Label>Where will you primarily workout?</Label>
//                                 <RadioGroup
//                                     value={watch("workout_location")}
//                                     onValueChange={(val) => setValue("workout_location", val)}
//                                     className="flex flex-col gap-3"
//                                 >
//                                     {formOptions.workoutLocations.map((location) => (
//                                         <div key={location.value} className="flex items-center space-x-2">
//                                             <RadioGroupItem value={location.value} id={location.id} />
//                                             <Label htmlFor={location.id}>{location.label}</Label>
//                                         </div>
//                                     ))}
//                                 </RadioGroup>
//                                 {errors.workout_location && (
//                                     <InputError>
//                                         {errors.workout_location.message}
//                                     </InputError>
//                                 )}
//                             </div>

//                             <Button
//                                 type="submit"
//                                 className="flex-1"
//                                 disabled={isSubmitting}
//                             >
//                                 {isSubmitting ? "Updating..." : "Update"}
//                             </Button>
//                         </div>
//                     </form>
//                 </CardContent>
//             </Card>
//         </>
//     );
// }