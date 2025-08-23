"use client"

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import api from "@/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { KebabMenu } from "@/components/ui/kebab-menu";
import Calendar from "@/components/calendar";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { InputError } from "@/components/ui/inputError";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { WeightEntrySchema } from "./profile-schema";
import { TrendingUp, Plus, ListCollapse } from "lucide-react";

function WeightManager() {
    const chartConfig = {
        weight: {
            label: "Weight",
            color: "var(--chart-1)",
        },
    };

    const {
        data: weightHistory = [],
        isPending,
        isError,
        refetch
    } = useQuery({
        queryKey: ["weight_history"],
        queryFn: async () => {
            const response = await api.get("accounts/weight-history/recent/");
            return response.data.data;
        }
    });

    // Gets chart data from response and sort it from old -> new logs
    const chartData = [...weightHistory]
        .sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date))
        .slice(-10) // only get the latest 10 entries
        .map((entry) => ({
            month: new Date(entry.recorded_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            }),
            weight: parseFloat(entry.weight),
        }))

    const [isDialogueOpen, setIsDialogueOpen] = useState(false);

    const openWeightDialogue = () => {
        setIsDialogueOpen(true);
    }

    const navigate = useNavigate();

    const menuItems = [
        { type: "title", label: "Weight Entry" },
        { icon: Plus, label: "Add Weight", action: openWeightDialogue },
        { icon: ListCollapse, label: "All Entries", action: () => navigate("/profile/weight-entries") },
    ]

    if (isPending) return <LoadingSpinner message="Chart" />

    return (
        <Card>
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
                            top: 20,
                            left: 12,
                            right: 12,
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
    const [apiError, setApiError] = useState("");

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        setError
    } = useForm({
        resolver: valibotResolver(WeightEntrySchema),
        defaultValues: {
            weight: "",
            recorded_date: new Date().toISOString().split('T')[0]
        }
    });

    const onSubmit = async (data) => {
        // Clear previous API errors
        setApiError("");

        try {
            const payload = {
                weight: data.weight.toFixed(2),
                recorded_date: data.recorded_date
            };

            await api.post("accounts/weight-history/", payload);

            // Reset form and close dialog
            reset();
            onOpenChange(false);
            onSuccess();

        } catch (err) {
            console.error("Error adding weight:", err);

            // Handle different error types
            if (err.response?.data?.errors) {
                const errors = err.response.data.errors;

                // Check for duplicate entry error (one per day constraint)
                if (errors.non_field_errors && errors.non_field_errors[0]) {
                    const errorMessage = errors.non_field_errors[0];
                    if (errorMessage.includes("Weight entry already exists for this date") ||
                        errorMessage.includes("one weight per day")) {
                        setApiError("You already have a weight entry for this date. You can only record one weight per day.");
                    } else {
                        setApiError(errorMessage);
                    }
                } else if (errors.recorded_date && errors.recorded_date[0]) {
                    // Set field-specific error
                    setError("recorded_date", {
                        type: "server",
                        message: errors.recorded_date[0]
                    });
                } else if (errors.weight && errors.weight[0]) {
                    // Set field-specific error
                    setError("weight", {
                        type: "server",
                        message: errors.weight[0]
                    });
                } else {
                    setApiError("Failed to add weight entry. Please try again.");
                }
            } else if (err.response?.data?.message) {
                // Handle message-level errors that might contain duplicate info
                const message = err.response.data.message;
                if (message.includes("Weight entry already exists") ||
                    message.includes("one weight per day")) {
                    setApiError("You already have a weight entry for this date. You can only record one weight per day.");
                } else {
                    setApiError(message);
                }
            } else if (err.response?.status === 400) {
                // Generic 400 error - likely validation issue including duplicates
                setApiError("Unable to add weight entry. You may already have an entry for this date, or the data is invalid.");
            } else {
                setApiError("Failed to add weight entry. Please check your connection and try again.");
            }
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            reset();
            setApiError("");
            onOpenChange(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={handleClose}>
            <AlertDialogContent className="w-sm">
                <AlertDialogHeader>
                    <AlertDialogTitle>Add Weight Entry</AlertDialogTitle>
                    <AlertDialogDescription>
                        Please enter the new weight measurement below.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2  gap-3">
                    {apiError && (
                        <InputError className="col-span-2 -mt-2 text-sm bg-red-50 p-2 rounded-lg">
                            {apiError}
                        </InputError>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                            id="weight"
                            type="number"
                            step="0.01"
                            placeholder="55.00"
                            disabled={isSubmitting}
                            {...register("weight")}
                        />
                        {errors.weight && (
                            <p className="text-red-600 text-sm">{errors.weight.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="recorded_date">Recorded At</Label>
                        <Input
                            id="recorded_date"
                            type="date"
                            max={new Date().toISOString().split('T')[0]}
                            disabled={isSubmitting}
                            {...register("recorded_date")}
                        />
                        {errors.recorded_date && (
                            <p className="text-red-600 text-sm">{errors.recorded_date.message}</p>
                        )}
                    </div>
                </form>

                <AlertDialogFooter>
                    <AlertDialogCancel
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Saving..." : "Save"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export { WeightManager }