import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants";

export const useSignup = (methods) => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async (data) => {
            // Transform the form data to match backend expectations
            const transformedData = {
                // Verification token
                verification_token: data.verification_token,

                // Account fields
                email: data.email,
                password: data.password,
                password_confirm: data.confirm_password,
                first_name: data.first_name,
                last_name: data.last_name,
                gender: data.gender,
                height_ft: Number(data.height_ft),
                height_in: Number(data.height_in),

                // Profile fields
                birth_date: data.birth_date,
                starting_weight: data.current_weight ? Number(data.current_weight) : null,
                current_weight: Number(data.current_weight),
                goal_weight: Number(data.goal_weight),
                start_weight_date: data.birth_date,
                activity_level: data.activity_level,
                body_goal: data.body_goal,
                workout_frequency: data.workout_frequency,
                workout_location: data.workout_location,

                // Optional fields
                injuries: data.injuries || "",
                food_allergies: data.food_allergies || "",
            };

            const response = await api.post("accounts/signup/", transformedData);
            return { ...data, ...response.data };
        },

        onSuccess: async (data) => {
            try {
                // Get authentication tokens
                const tokenResponse = await api.post("accounts/token/", {
                    email: data.email,
                    password: data.password,
                });

                localStorage.setItem(ACCESS_TOKEN, tokenResponse.data.access);
                localStorage.setItem(REFRESH_TOKEN, tokenResponse.data.refresh);

                navigate("/profile");
            } catch (tokenError) {
                console.error("Token retrieval failed:", tokenError);
                // Even if token fails, account was created successfully
                navigate("/login");
            }
        },

        onError: (error) => {
            console.error("Signup failed:", error);

            // Handle specific backend validation errors
            if (error.response?.data?.errors) {
                const backendErrors = error.response.data.errors;

                // Map backend errors to form fields
                Object.keys(backendErrors).forEach((field) => {
                    if (backendErrors[field]) {
                        let formField = field;

                        // Map backend field names to form field names if needed
                        if (field === "password_confirm") {
                            formField = "confirm_password";
                        }

                        methods.setError(formField, {
                            type: "manual",
                            message: Array.isArray(backendErrors[field])
                                ? backendErrors[field][0]
                                : backendErrors[field],
                        });
                    }
                });
            }
        },
    });
};