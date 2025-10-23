import { useForm } from "react-hook-form";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import api from "@/api";
import { AdditionalInformationSchema } from "../schema/edit-schema";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Card, CardContent } from "@/components/ui/card";
import { SectionSubTitle } from "@/components/ui/section-title";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { InputError } from "@/components/ui/inputError";
import { formOptions } from "@/pages/sign-up/signup-schema";

export function UpdateAdditionalInfo({ userData }) {
    const queryClient = useQueryClient();
    const userProfile = userData.profile;

    const {
        handleSubmit,
        register,
        setValue,
        watch,
        formState: { errors, dirtyFields }
    } = useForm({
        resolver: valibotResolver(AdditionalInformationSchema),
        defaultValues: {
            injuries: userProfile?.injuries || "",
            food_allergies: userProfile?.food_allergies || "",
            workout_frequency: userProfile?.workout_frequency || "",
            workout_location: userProfile?.workout_location || "",
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
    });

    const onSubmit = async (data) => {
        // Create an object with only the changed fields
        const transformedData = Object.keys(dirtyFields).reduce((acc, field) => {
            acc[field] = data[field];
            return acc;
        }, {});

        // Only mutate if there are actual changes
        if (Object.keys(transformedData).length > 0) {
            mutate(transformedData);
        } else {
            console.log("No changes detected");
        }
    };

    return (
        <>
            <SectionSubTitle className="text-lg lg:text-xl font-bold">Additional Information</SectionSubTitle>
            <Card className="w-full max-w-lg">
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)}>
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
                                disabled={isPending}
                            >
                                {isPending ? "Updating..." : "Update"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </>
    );
}