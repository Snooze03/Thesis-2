import api from "@/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useProgressPhoto() {
    const queryClient = useQueryClient();

    const uploadBeforePhoto = useMutation({
        mutationFn: async (photoData) => {
            // Convert base64 to blob
            const response = await fetch(photoData.photo);
            const blob = await response.blob();

            // Create FormData object
            const formData = new FormData();
            formData.append('before_photo', blob, 'before_photo.jpg');

            if (photoData.date_before) {
                formData.append('date_before', photoData.date_before);
            }

            const apiResponse = await api.post(
                "/accounts/progress-photos/upload_before_photo/",
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                }
            );
            return apiResponse.data;
        },
        onSuccess: () => {
            // Invalidate and refetch progress photos
            queryClient.invalidateQueries({ queryKey: ["progressPhotos"] });
        }
    });


    const uploadAfterPhoto = useMutation({
        mutationFn: async (photoData) => {
            // Convert base64 to blob
            const response = await fetch(photoData.photo);
            const blob = await response.blob();

            // Create FormData object
            const formData = new FormData();
            formData.append('after_photo', blob, 'after_photo.jpg');

            // Add date if provided
            if (photoData.date_after) {
                formData.append('date_after', photoData.date_after);
            }

            const apiResponse = await api.post(
                "/accounts/progress-photos/upload_after_photo/",
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                }
            );
            return apiResponse.data;
        },
        onSuccess: () => {
            // Invalidate and refetch progress photos
            queryClient.invalidateQueries({ queryKey: ["progressPhotos"] });
        }
    });

    const getProgressPhotos = useQuery({
        queryKey: ["progressPhotos"],
        queryFn: async () => {
            const response = await api.get("/accounts/progress-photos/");
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    });

    const removeBeforePhoto = useMutation({
        mutationFn: async () => {
            const response = await api.delete("/accounts/progress-photos/remove_before_photo/");
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["progressPhotos"] });
        }
    });

    const removeAfterPhoto = useMutation({
        mutationFn: async () => {
            const response = await api.delete("/accounts/progress-photos/remove_after_photo/");
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["progressPhotos"] });
        }
    });

    return {
        // Upload mutations
        uploadBeforePhoto,
        uploadAfterPhoto,

        // Remove mutations
        removeBeforePhoto,
        removeAfterPhoto,

        // Query data
        progressPhotos: getProgressPhotos.data?.[0] || null, // Since you return array with single object
        isLoading: getProgressPhotos.isLoading,
        error: getProgressPhotos.error,
    };
}