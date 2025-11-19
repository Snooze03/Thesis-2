import api from "@/api";
import { useQuery } from "@tanstack/react-query";

export function fetchProgressReport(userId) {
    const progressReports = useQuery({
        queryKey: ['progressReport', userId],
        queryFn: async () => {
            const response = await api.get(`/assistant/progress-reports/`);
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
        refetchOnWindowFocus: false,
    });

    return {
        progressReports: progressReports.data,
        isLoading: progressReports.isLoading,
        isError: progressReports.isError,
    }
}

export function fetchProgressReportDetails(reportId) {
    const progressReportDetails = useQuery({
        queryKey: ['progressReportDetails', reportId],
        queryFn: async () => {
            const response = await api.get(`/assistant/progress-reports/full/${reportId}/`);
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
        refetchOnWindowFocus: false,
    });

    return {
        data: progressReportDetails.data,
        isLoading: progressReportDetails.isLoading,
        isError: progressReportDetails.isError,
    }
}