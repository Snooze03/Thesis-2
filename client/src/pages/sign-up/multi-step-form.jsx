import { useForm, FormProvider } from "react-hook-form";
import { useState } from "react";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { SignUp } from "./stepOne";
import { BasicInfo } from "./stepTwo";
import { AdditionalInfo } from "./stepThree";
import { ValidatedMultiStepSchema, defaultFormValues, stepFields } from "./signup-schema";

export const MultiStepForm = () => {
    const [step, setStep] = useState(1);

    const methods = useForm({
        resolver: valibotResolver(ValidatedMultiStepSchema),
        defaultValues: defaultFormValues,
        mode: "onChange",
    });

    // Submit handler
    const onSubmit = (data) => {
        console.log("Complete Form Submitted:", data);
        // Handle final form submission here
    };

    const nextStep = async () => {
        // Validate only the fields for the current step
        const fieldsToValidate = stepFields[step];
        const valid = await methods.trigger(fieldsToValidate);

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