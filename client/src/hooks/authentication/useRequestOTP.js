import { useMutation } from "@tanstack/react-query";
import api from "@/api";
import toast from "react-hot-toast";

export const useRequestOTP = () => {
    return useMutation({
        mutationFn: async (email) => {
            const response = await api.post("accounts/request-otp/", { email });
            return response.data;
        },

        onSuccess: (data) => {
            toast.success(data.message || "Verification code sent to your email");
        },

        onError: (error) => {
            console.error("Request OTP failed:", error);

            const errorMessage =
                error.response?.data?.errors?.email?.[0] ||
                error.response?.data?.message ||
                "Failed to send verification code. Please try again.";

            toast.error(errorMessage);
        },
    });
};