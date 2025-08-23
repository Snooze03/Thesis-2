import { useNavigate } from "react-router-dom";
import { SubLayout } from "@/layouts/sub-layout";
import api from "@/api";
import { SectionTitle } from "@/components/ui/section-title";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

function WeightAllEntries() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {
        data: weightEntries = [],
        isPending,
        isError
    } = useQuery({
        queryKey: ["weightEntries"],
        queryFn: async () => {
            const response = await api.get("/accounts/weight-history/");
            return response.data.data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/accounts/weight-history/${id}/`);
        },
        onSuccess: () => {
            // Invalidate and refetch the weight entries
            toast.success("Entry deleted successfully!");
            queryClient.invalidateQueries({ queryKey: ["weightEntries"] });
        },
        onError: (error) => {
            toast.error("Failed to delete weight entry");
            console.error('Delete error:', error);
        }
    });

    console.log(weightEntries);
    const handleDelete = (id) => {
        deleteMutation.mutate(id);
    };

    // Sort entries by date (latest first) and group by month
    const sortedAndGroupedEntries = weightEntries
        .sort((a, b) => new Date(b.recorded_date) - new Date(a.recorded_date))
        .reduce((groups, entry) => {
            const date = new Date(entry.recorded_date);
            const monthYear = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
            });

            if (!groups[monthYear]) {
                groups[monthYear] = [];
            }
            groups[monthYear].push(entry);

            return groups;
        }, {});

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const getWeightChangeColor = (change) => {
        if (change > 0) return 'text-red-500';
        if (change < 0) return 'text-green-500';
        return 'text-gray-500';
    };

    const getWeightChangeText = (change) => {
        if (!change) return '';
        const sign = change > 0 ? '+' : '';
        return `${sign}${change} kg`;
    };

    return (
        <SubLayout>
            <div className="flex gap-2 items-center">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft className="size-4" />
                </Button>
                <SectionTitle>All Entries</SectionTitle>
            </div>

            {isPending && <LoadingSpinner message="Loading entries..." />}
            {isError && (
                <div className="text-center py-8 text-red-500">
                    <p className="text-lg font-medium">Error loading weight entries</p>
                    <p className="text-sm mt-2 text-gray-600">Please try again later</p>
                </div>
            )}

            {!isPending && !isError && (
                <div className="space-y-6">
                    {Object.entries(sortedAndGroupedEntries).map(([monthYear, entries]) => (
                        <div key={monthYear} className="space-y-3">
                            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                                {monthYear}
                            </h2>
                            <div className="space-y-2">
                                {entries.map(entry => (
                                    <div key={entry.id} className={cn(
                                        "px-4 py-3 rounded-lg border",
                                        "flex justify-between items-center"
                                    )}>
                                        <div className="flex flex-col gap-1">
                                            <p className="font-medium text-lg">{entry.weight} kg</p>
                                            <p className="text-sm text-gray-600">{formatDate(entry.recorded_date)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {entry.weight_change && (
                                                <div className={cn(
                                                    "text-sm font-medium",
                                                    getWeightChangeColor(entry.weight_change)
                                                )}>
                                                    {getWeightChangeText(entry.weight_change)}
                                                </div>
                                            )}
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => e.stopPropagation()}
                                                        disabled={deleteMutation.isPending}
                                                        className="text-gray-500 hover:text-red-500 hover:bg-red-50 p-2"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Weight Entry</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete this weight entry of {entry.weight} kg from {formatDate(entry.recorded_date)}?
                                                            This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(entry.id)}
                                                            className="bg-red-600 hover:bg-red-700"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </SubLayout>
    );
}

export { WeightAllEntries }