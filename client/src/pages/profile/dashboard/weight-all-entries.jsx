import { useNavigate } from "react-router-dom";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useWeightHistory, useDeleteWeightEntry } from "@/hooks/profile/useWeightEntry";
import { SubLayout } from "@/layouts/sub-layout";
import { SectionTitle } from "@/components/ui/section-title";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { KebabMenu } from "@/components/ui/kebab-menu";
import { cn } from "@/lib/utils";
import { useState } from "react";

function WeightAllEntries() {
    const navigate = useNavigate();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedEntryId, setSelectedEntryId] = useState(null);
    const [selectedEntry, setSelectedEntry] = useState(null);

    const {
        weightEntries,
        isLoading,
        isError
    } = useWeightHistory();

    const {
        deleteMutation,
        isPending,
        isError: isDeleteError,
    } = useDeleteWeightEntry();

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

    useScrollLock(isLoading);

    // ===== EVENT HANDLERS =====
    const handleDeleteClick = (entry) => {
        setSelectedEntry(entry);
        setSelectedEntryId(entry.id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        deleteMutation.mutate(selectedEntryId);
        setDeleteDialogOpen(false);
    };

    const handleEdit = (id) => {
        console.log(`Edit ${id}`)
    }
    // ===== END EVENT HANDLERS =====


    return (
        <SubLayout>
            <div className="flex gap-2 items-center">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft className="size-4" />
                </Button>
                <SectionTitle>All Entries</SectionTitle>
            </div>

            {isLoading && (
                <>
                    <Skeleton className="h-7 w-35 rounded-lg" />
                    {[...Array(3)].map((_, index) => (
                        <Skeleton key={index} className="h-15 w-full rounded-lg" />
                    ))}
                </>
            )}

            {isError && (
                <div className="text-center py-8 text-red-500">
                    <p className="text-lg font-medium">Error loading weight entries</p>
                    <p className="text-sm mt-2 text-gray-600">Please try again later</p>
                </div>
            )}

            {/* Main Content */}
            {!isLoading && !isError && (
                <div className="space-y-6">
                    {Object.entries(weightEntries).map(([monthYear, entries]) => (
                        // Month & Year Group
                        <div key={monthYear} className="space-y-3">
                            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                                {monthYear}
                            </h2>
                            <div className="space-y-2">
                                {entries.map(entry => {
                                    const menuItems = [
                                        { icon: Pencil, label: "Edit", action: () => handleEdit(entry.id) },
                                        { icon: Trash2, label: "Delete", action: () => handleDeleteClick(entry), variant: "destructive" },
                                    ];

                                    return (
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
                                                <KebabMenu items={menuItems} disabled={deleteMutation.isPending} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete entry dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Weight Entry</AlertDialogTitle>
                        <AlertDialogDescription>
                            {selectedEntry && (
                                <>
                                    Are you sure you want to delete this weight entry of {selectedEntry.weight} kg from {formatDate(selectedEntry.recorded_date)}?
                                    This action cannot be undone.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogFooter>
                            <Button variant="destructive" onClick={handleDeleteConfirm}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </SubLayout>
    );
}

export { WeightAllEntries }