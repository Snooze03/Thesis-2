import { useMutation } from "@tanstack/react-query";
import api from "@/api";
import toast from "react-hot-toast";

export const useResendOTP = () => {
    return useMutation({
        mutationFn: async (email) => {
            const response = await api.post("accounts/resend-otp/", { email });
            return response.data;
        },

        onSuccess: (data) => {
            toast.success(data.message || "New verification code sent!");
        },

        onError: (error) => {
            console.error("Resend OTP failed:", error);

            const errorMessage =
                error.response?.data?.errors?.email?.[0] ||
                error.response?.data?.message ||
                "Failed to resend code. Please try again.";

            toast.error(errorMessage);
        },
    });
};