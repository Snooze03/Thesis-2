import { useMutation } from "@tanstack/react-query";
import api from "@/api";
import toast from "react-hot-toast";

export const useVerifyOTP = () => {
    return useMutation({
        mutationFn: async ({ email, otp }) => {
            const response = await api.post("accounts/verify-otp/", {
                email,
                otp,
            });
            return response.data;
        },

        onSuccess: (data) => {
            toast.success(data.message || "Email verified successfully!");
        },

        onError: (error) => {
            console.error("Verify OTP failed:", error);

            // Extract error message from backend response
            const errorData = error.response?.data?.errors;
            let errorMessage = "Verification failed. Please try again.";

            if (errorData) {
                // Handle field-specific errors
                if (errorData.otp) {
                    errorMessage = Array.isArray(errorData.otp)
                        ? errorData.otp[0]
                        : errorData.otp;
                } else if (errorData.email) {
                    errorMessage = Array.isArray(errorData.email)
                        ? errorData.email[0]
                        : errorData.email;
                }
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            toast.error(errorMessage);
        },
    });
};