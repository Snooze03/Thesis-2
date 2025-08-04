import { useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { useState } from "react";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { SignUp } from "./stepOne";
import { BasicInfo } from "./stepTwo";
import { AdditionalInfo } from "./stepThree";
import { ValidatedMultiStepSchema, defaultFormValues, stepFields } from "./signup-schema";
import api from "@/api";
import { useMutation } from "@tanstack/react-query";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants";

export const MultiStepForm = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    const methods = useForm({
        resolver: valibotResolver(ValidatedMultiStepSchema),
        defaultValues: defaultFormValues,
        mode: "onChange",
    });

    // Function to exclude certain fields to post request
    const excludeFields = (data, fieldsToExclude) => {
        const result = { ...data };
        fieldsToExclude.forEach(field => delete result[field]);
        return result;
    };

    // Post request to create new account to server
    const { mutate, isPending } = useMutation({
        mutationFn: async (data) => {
            // After successfully creating a new account, get the token and save it
            const post_signup = await api.post("accounts/signup/", data);

            const get_token = await api.post("accounts/token/", { email: data.email, password: data.password });
            localStorage.setItem(ACCESS_TOKEN, get_token.data.access);
            localStorage.setItem(REFRESH_TOKEN, get_token.data.refresh);

            navigate("/");
        },
    });

    // Submit handler
    const onSubmit = (data) => {
        const formData = excludeFields(data, ["confirm_password"])
        console.log("Complete Form Submitted:", formData);
        mutate(formData);
    };

    // Multi step form handler
    const nextStep = async () => {
        // Validate only the fields for the current step
        const fieldsToValidate = stepFields[step];
        const valid = await methods.trigger(fieldsToValidate);

        // If fields are valid move on to the next form
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
                {step === 3 && <AdditionalInfo prevStep={prevStep} />}
            </form>
        </FormProvider>
    );
};