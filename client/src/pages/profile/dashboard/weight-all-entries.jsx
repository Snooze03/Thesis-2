import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useWeightHistory, useDeleteWeightEntry, useEditWeightEntry } from "@/hooks/profile/useWeightEntry";
import { SubLayout } from "@/layouts/sub-layout";
import { SectionTitle } from "@/components/ui/section-title";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { KebabMenu } from "@/components/ui/kebab-menu";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/formatDate";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { InputError } from "@/components/ui/inputError";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WeightEntrySchema } from "../schema/weight-entry-schema";
import { useState } from "react";

function WeightAllEntries() {
    const navigate = useNavigate();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedEntryId, setSelectedEntryId] = useState(null);
    const [selectedEntry, setSelectedEntry] = useState(null);

    const {
        weightEntries,
        isLoading,
        isError
    } = useWeightHistory();

    const {
        mutate: deleteEntry,
        isPending: isDeleting,
    } = useDeleteWeightEntry();

    const {
        mutate: editEntry,
        isPending: isEditing,
    } = useEditWeightEntry();

    useScrollLock(isLoading);

    // ===== STYLE HELPERS =====
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
    // ===== END STYLE HELPERS =====

    // ===== EVENT HANDLERS =====
    const handleEditClick = (entry) => {
        setSelectedEntry(entry);
        setSelectedEntryId(entry.id);
        setEditDialogOpen(true);
    };

    const handleDeleteClick = (entry) => {
        setSelectedEntry(entry);
        setSelectedEntryId(entry.id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        deleteEntry(selectedEntryId);
        setDeleteDialogOpen(false);
    };
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
                        <div key={monthYear} className="space-y-3">
                            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                                {monthYear}
                            </h2>
                            <div className="space-y-2">
                                {entries.map(entry => {
                                    const menuItems = [
                                        { icon: Pencil, label: "Edit", action: () => handleEditClick(entry) },
                                        { icon: Trash2, label: "Delete", action: () => handleDeleteClick(entry), variant: "destructive" },
                                    ];

                                    return (
                                        <div key={entry.id} className={cn(
                                            "px-4 py-3 rounded-lg border",
                                            "flex justify-between items-center"
                                        )}>
                                            <div className="flex flex-col gap-1">
                                                <p className="font-medium text-lg">{entry.weight} kg</p>
                                                <p className="text-sm text-gray-600">{formatDate(entry.recorded_date, 'ddd, MMM DD')}</p>
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
                                                <KebabMenu items={menuItems} disabled={isDeleting || isEditing} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Weight Dialog */}
            <EditWeight
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                entry={selectedEntry}
                entryId={selectedEntryId}
            />

            {/* Delete entry dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Weight Entry</AlertDialogTitle>
                        <AlertDialogDescription>
                            {selectedEntry && (
                                <>
                                    Are you sure you want to delete this weight entry of <span className="font-bold">{selectedEntry.weight} kg</span> from <span className="font-bold">{formatDate(selectedEntry.recorded_date, 'ddd, MMM DD')}</span>?
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

function EditWeight({ open, onOpenChange, entry, entryId }) {
    const { mutate: editEntry, isPending } = useEditWeightEntry();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        setError
    } = useForm({
        resolver: valibotResolver(WeightEntrySchema),
        defaultValues: {
            weight: entry?.weight || "",
            recorded_date: entry?.recorded_date || new Date().toISOString().split('T')[0]
        },
        values: entry ? {
            weight: entry.weight,
            recorded_date: entry.recorded_date
        } : undefined
    });

    const handleApiError = (err) => {
        const errorData = err.response?.data;

        if (errorData?.errors) {
            const { errors: apiErrors } = errorData;

            Object.keys(apiErrors).forEach((field) => {
                if (field === "non_field_errors") {
                    toast.error(apiErrors[field][0] || "Failed to update weight entry");
                } else if (["weight", "recorded_date"].includes(field)) {
                    setError(field, {
                        type: "server",
                        message: apiErrors[field][0]
                    });
                }
            });
        } else if (errorData?.message) {
            toast.error(errorData.message);
        } else {
            toast.error("Failed to update weight entry. Please try again.");
        }
    };

    const onSubmit = async (data) => {
        editEntry(
            { id: entryId, data },
            {
                onSuccess: () => {
                    reset();
                    onOpenChange(false);
                },
                onError: handleApiError
            }
        );
    };

    const handleClose = () => {
        if (!isPending) {
            reset();
            onOpenChange(false);
        }
    };

    const errorMessage = errors.weight?.message || errors.recorded_date?.message;

    return (
        <AlertDialog open={open} onOpenChange={handleClose}>
            <AlertDialogContent className="w-sm">
                <AlertDialogHeader>
                    <AlertDialogTitle>Edit Weight Entry</AlertDialogTitle>
                    <AlertDialogDescription>
                        Update the weight measurement below.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3">
                    {errorMessage && (
                        <InputError className="col-span-2 -mt-2">{errorMessage}</InputError>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                            id="weight"
                            type="number"
                            step="0.01"
                            placeholder="55.00"
                            disabled={isPending}
                            {...register("weight")}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="recorded_date">Recorded At</Label>
                        <Input
                            id="recorded_date"
                            type="date"
                            max={new Date().toISOString().split('T')[0]}
                            disabled={isPending}
                            {...register("recorded_date")}
                        />
                    </div>
                </form>

                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleClose} disabled={isPending}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmit(onSubmit)} disabled={isPending}>
                        {isPending ? "Updating..." : "Update"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export { WeightAllEntries }