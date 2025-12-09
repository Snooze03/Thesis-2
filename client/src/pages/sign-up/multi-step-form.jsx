import { useForm, FormProvider } from "react-hook-form";
import { useState } from "react";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { SignUp } from "./stepOne";
import { BasicInfo } from "./stepTwo";
import { AdditionalInfo } from "./stepThree";
import { OTPVerification } from "./OTPVerification";
import { MultiStepSchema, defaultFormValues, stepFields } from "./signup-schema";
import { useSignup } from "@/hooks/authentication/useSignup";
import { useRequestOTP } from "@/hooks/authentication/useRequestOTP";

export const MultiStepForm = () => {
    const [step, setStep] = useState(1);
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [verificationToken, setVerificationToken] = useState(null);
    const [pendingEmail, setPendingEmail] = useState(null);

    const methods = useForm({
        resolver: valibotResolver(MultiStepSchema),
        defaultValues: defaultFormValues,
        mode: "onChange",
    });

    const { getValues } = methods;
    const { mutate, isPending, error } = useSignup(methods);
    const { mutate: requestOTP, isPending: isRequestingOTP } = useRequestOTP();

    // ===== EVENT HANDLERS =====
    const onSubmit = (data) => {
        // Add verification token to submission data
        const submissionData = {
            ...data,
            verification_token: verificationToken,
        };
        mutate(submissionData);
    };

    const handleOTPVerified = (token) => {
        setVerificationToken(token);
        setShowOTPModal(false);
        setStep(2);
    };

    const handleOTPClose = () => {
        setShowOTPModal(false);
        setPendingEmail(null);
    };
    // ===== END EVENT HANDLERS =====

    // Multi step form handler
    const nextStep = async () => {
        // Validate only the fields for the current step
        const fieldsToValidate = stepFields[step];
        const valid = await methods.trigger(fieldsToValidate);

        // Special handling for Step 1: Trigger OTP verification
        if (step === 1) {
            const { password, confirm_password } = getValues();

            // Check password confirmation
            if (password !== confirm_password) {
                methods.setError("confirm_password", {
                    type: "manual",
                    message: "Passwords do not match",
                });
                return;
            }

            // If valid, trigger OTP flow
            if (valid) {
                const email = getValues("email");
                setPendingEmail(email);

                // Request OTP from backend
                requestOTP(email, {
                    onSuccess: () => {
                        // Show OTP modal on successful OTP request
                        setShowOTPModal(true);
                    },
                });

                // Don't increment step - wait for OTP verification
                return;
            }
        }

        // For other steps, just move forward if valid
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
                {step === 1 && <SignUp nextStep={nextStep} isRequesting={isRequestingOTP} />}
                {step === 2 && <BasicInfo nextStep={nextStep} prevStep={prevStep} />}
                {step === 3 && <AdditionalInfo prevStep={prevStep} isSubmitting={isPending} />}

                {/* OTP Verification Modal */}
                {showOTPModal && pendingEmail && (
                    <OTPVerification
                        email={pendingEmail}
                        onVerified={handleOTPVerified}
                        onClose={handleOTPClose}
                    />
                )}

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