"use client"

import { useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { useState } from "react";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { SignUp } from "./stepOne";
import { BasicInfo } from "./stepTwo";
import { AdditionalInfo } from "./stepThree";
import { MultiStepSchema, defaultFormValues, stepFields } from "./signup-schema";
import api from "@/api";
import { useMutation } from "@tanstack/react-query";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants";

export const MultiStepForm = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    const methods = useForm({
        resolver: valibotResolver(MultiStepSchema),
        defaultValues: defaultFormValues,
        mode: "onChange",
    });

    const { getValues } = methods;

    // Post request to create new account to server
    const {
        mutate,
        isPending,
        error
    } = useMutation({
        mutationFn: async (data) => {
            // Transform the form data to match backend expectations
            const transformedData = {
                // Account fields
                email: data.email,
                password: data.password,
                password_confirm: data.confirm_password, // Backend expects password_confirm
                first_name: data.first_name,
                last_name: data.last_name,
                gender: data.gender,
                height_ft: Number(data.height_ft),
                height_in: Number(data.height_in),

                // Profile fields
                starting_weight: Number(data.current_weight), // Use current as starting weight
                current_weight: Number(data.current_weight),
                goal_weight: Number(data.goal_weight),
                start_weight_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
                activity_level: data.activity_level,
                body_goal: data.body_goal,
                workout_frequency: data.workout_frequency,
                workout_location: data.workout_location,
                injuries: data.injuries || "", // Ensure empty string if null/undefined
                food_allergies: data.food_allergies || "", // Ensure empty string if null/undefined
            };

            console.log("Sending to backend:", transformedData);

            const response = await api.post("accounts/signup/", transformedData);
            return { ...data, ...response.data };
        },
        onSuccess: async (data) => {
            try {
                // Get authentication tokens
                const tokenResponse = await api.post("accounts/token/", {
                    email: data.email,
                    password: data.password
                });

                localStorage.setItem(ACCESS_TOKEN, tokenResponse.data.access);
                localStorage.setItem(REFRESH_TOKEN, tokenResponse.data.refresh);

                navigate("/profile");
            } catch (tokenError) {
                console.error("Token retrieval failed:", tokenError);
                // Even if token fails, account was created successfully
                // Could redirect to login page instead
                navigate("/login");
            }
        },
        onError: (error) => {
            console.error("Signup failed:", error);
            // Handle specific backend validation errors
            if (error.response?.data?.errors) {
                const backendErrors = error.response.data.errors;

                // Map backend errors to form fields
                Object.keys(backendErrors).forEach(field => {
                    if (backendErrors[field]) {
                        let formField = field;

                        // Map backend field names to form field names if needed
                        if (field === 'password_confirm') {
                            formField = 'confirm_password';
                        }

                        methods.setError(formField, {
                            type: "manual",
                            message: Array.isArray(backendErrors[field])
                                ? backendErrors[field][0]
                                : backendErrors[field]
                        });
                    }
                });
            }
        }
    });

    // Submit handler
    const onSubmit = (data) => {
        console.log("Form data before submission:", data);
        mutate(data);
    };

    // Multi step form handler
    const nextStep = async () => {
        // Validate only the fields for the current step
        const fieldsToValidate = stepFields[step];
        const valid = await methods.trigger(fieldsToValidate);

        const { password, confirm_password } = getValues();

        // Special check for Step 1: Password Confirmation
        if (step === 1 && password !== confirm_password) {
            methods.setError("confirm_password", {
                type: "manual",
                message: "Passwords do not match",
            });
            return;
        }

        // If everything is valid, move to the next step
        if (valid) {
            setStep((prev) => prev + 1);
        }
    };

    const prevStep = () => {
        setStep((prev) => prev - 1);
    };

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
                {step === 1 && <SignUp nextStep={nextStep} />}
                {step === 2 && <BasicInfo nextStep={nextStep} prevStep={prevStep} />}
                {step === 3 && <AdditionalInfo prevStep={prevStep} isSubmitting={isPending} />}

                {/* Display general error messages */}
                {error && (
                    <div className="text-red-500 text-sm mt-2 text-center">
                        {error.response?.data?.message || "An error occurred during registration"}
                    </div>
                )}
            </form>
        </FormProvider>
    );
};