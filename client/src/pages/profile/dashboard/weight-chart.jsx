import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAddWeightEntry, useRecentWeightHistory } from "@/hooks/profile/useWeightEntry";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { KebabMenu } from "@/components/ui/kebab-menu";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { InputError } from "@/components/ui/inputError";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { WeightEntrySchema } from "../schema/weight-entry-schema";
import { TrendingUp, Plus, ListCollapse } from "lucide-react";

function WeightManager() {
    const navigate = useNavigate();
    const [isDialogueOpen, setIsDialogueOpen] = useState(false);

    const chartConfig = {
        weight: {
            label: "Weight",
            color: "var(--chart-1)",
        },
    };

    const {
        weightHistory,
        chartData,
        isLoading,
        refetch
    } = useRecentWeightHistory();

    // ===== EVENT HANDLERS =====
    const openWeightDialogue = () => {
        setIsDialogueOpen(true);
    }
    // ===== END EVENT HANDLERS =====

    const menuItems = [
        { type: "title", label: "Weight Entry" },
        { icon: Plus, label: "Add Weight", action: openWeightDialogue },
        { icon: ListCollapse, label: "All Entries", action: () => navigate("/profile/weight-entries") },
    ]

    if (isLoading) return <LoadingSpinner message="Chart" />

    return (
        <Card className="gap-2">
            <CardHeader>
                <div className="flex justify-between gap-3 items-center">
                    <div className="flex flex-col gap-1">
                        <CardTitle>Weight Progress</CardTitle>
                        <CardDescription>Recent entries</CardDescription>
                    </div>
                    <KebabMenu items={menuItems} />
                    <AddWeight
                        open={isDialogueOpen}
                        onOpenChange={setIsDialogueOpen}
                        onSuccess={refetch}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <LineChart
                        data={chartData}
                        margin={{
                            top: 15,
                            left: 12,
                            right: 12,
                            bottom: 10
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            interval="preserveStartEnd"
                            tickFormatter={(value, index) => (index % 2 === 0 ? value : "")}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <Line
                            dataKey="weight"
                            type="natural"
                            stroke="var(--chart-1)"
                            strokeWidth={2}
                            dot={{ fill: "var(--chart-1)" }}
                            activeDot={{ r: 6 }}
                        >
                            <LabelList
                                position="top"
                                offset={12}
                                className="fill-foreground"
                                fontSize={12}
                            />
                        </Line>
                    </LineChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex items-center text-sm">
                <div className="text-muted-foreground leading-none">
                    Showing your most recent {weightHistory.length} entries <TrendingUp className="size-4 inline" />
                </div>
            </CardFooter>
        </Card>
    );
}

function AddWeight({ open, onOpenChange, onSuccess }) {
    const { mutate: addEntry, isPending } = useAddWeightEntry();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        setError
    } = useForm({
        resolver: valibotResolver(WeightEntrySchema),
        defaultValues: {
            weight: "",
            recorded_date: new Date().toISOString().split('T')[0]
        }
    });

    const handleApiError = (err) => {
        const errorData = err.response?.data;

        // Handle field-specific errors
        if (errorData?.errors) {
            const { errors: apiErrors } = errorData;

            // Set field errors using react-hook-form
            Object.keys(apiErrors).forEach((field) => {
                if (field === "non_field_errors") {
                    toast.error(apiErrors[field][0] || "Failed to add weight entry");
                } else if (["weight", "recorded_date"].includes(field)) {
                    setError(field, {
                        type: "server",
                        message: apiErrors[field][0]
                    });
                }
            });
        }
        // Handle general error messages
        else if (errorData?.message) {
            toast.error(errorData.message);
        }
        // Fallback error
        else {
            toast.error("Failed to add weight entry. Please try again.");
        }
    };

    const onSubmit = async (data) => {
        addEntry(data, {
            onSuccess: () => {
                reset();
                onOpenChange(false);
                onSuccess();
            },
            onError: handleApiError
        });
    };

    const handleClose = () => {
        if (!isPending) {
            reset();
            onOpenChange(false);
        }
    };

    // Get the first error message if any
    const errorMessage = errors.weight?.message || errors.recorded_date?.message;

    return (
        <AlertDialog open={open} onOpenChange={handleClose}>
            <AlertDialogContent className="w-sm">
                <AlertDialogHeader>
                    <AlertDialogTitle>Add Weight Entry</AlertDialogTitle>
                    <AlertDialogDescription>
                        Please enter the new weight measurement below.
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
                        {isPending ? "Saving..." : "Save"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export { WeightManager }