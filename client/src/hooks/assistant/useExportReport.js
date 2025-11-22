import api from "@/api";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function useExportReport() {
    const mutation = useMutation({
        mutationFn: async (reportId) => {
            const response = await api.get(`/assistant/progress-reports/${reportId}/export-pdf/`, {
                responseType: 'blob',
            });
            return { data: response.data, reportId };
        },
        onSuccess: ({ data, reportId }) => {
            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute(
                'download',
                `progress_report_${reportId}_${new Date().toISOString().split('T')[0]}.pdf`
            );
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("PDF downloaded successfully!");
        },
        onError: (error) => {
            toast.error("Error downloading PDF. Please try again.");
            console.log("PDF Export Error:", error);
        }
    });

    return {
        exportReport: mutation.mutate,
        isLoading: mutation.isPending,
        isError: mutation.isError,
    };
}