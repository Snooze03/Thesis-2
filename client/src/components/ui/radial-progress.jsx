import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const radialProgressVariants = cva("relative inline-flex items-center justify-center", {
    variants: {
        size: {
            sm: "h-12 w-12",
            default: "h-16 w-16",
            lg: "h-20 w-20",
            xl: "h-24 w-24",
        },
    },
    defaultVariants: {
        size: "default",
    },
})

const RadialProgress = React.forwardRef(
    ({ className, size, value = 0, max = 100, strokeWidth = 8, showValue = true, label, children, ...props }, ref) => {
        // Calculate remaining value (max - current value)
        // Allow any value, don't clamp to max
        const normalizedValue = Math.max(value, 0); // Only prevent negative values
        const remaining = Math.max(0, max - normalizedValue); // Remaining can't be negative
        const percentage = max > 0 ? (remaining / max) * 100 : 0; // Prevent division by zero

        // Calculate dimensions based on size
        const sizeMap = {
            sm: { radius: 20, viewBox: 48 },
            default: { radius: 28, viewBox: 64 },
            lg: { radius: 36, viewBox: 80 },
            xl: { radius: 44, viewBox: 96 }
        };

        const { radius, viewBox } = sizeMap[size] || sizeMap.default;

        const textSizeMap = {
            sm: { value: "text-xs", label: "text-xs" },
            default: { value: "text-sm", label: "text-xs" },
            lg: { value: "text-base", label: "text-xs" },
            xl: { value: "text-lg", label: "text-sm" }
        };

        const textSizes = textSizeMap[size] || textSizeMap.default;

        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        return (
            <div
                ref={ref}
                className={cn(radialProgressVariants({ size, className }))}
                role="progressbar"
                aria-valuenow={remaining}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-label={`${remaining} remaining out of ${max}`}
                {...props}
            >
                <svg className="transform -rotate-90" width="100%" height="100%" viewBox={`0 0 ${viewBox} ${viewBox}`}>
                    {/* Background circle */}
                    <circle
                        cx={viewBox / 2}
                        cy={viewBox / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="none"
                        className="text-gray-100"
                    />
                    {/* Progress circle */}
                    <circle
                        cx={viewBox / 2}
                        cy={viewBox / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="text-primary transition-all duration-300 ease-in-out"
                    />
                </svg>

                {/* Content overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    {children ? (
                        children
                    ) : showValue ? (
                        <>
                            <span className={`font-medium text-foreground ${textSizes.value}`}>{remaining}</span>
                            {label && <span className={`text-muted-foreground ${textSizes.label}`}>{label}</span>}
                        </>
                    ) : null}
                </div>
            </div>
        );
    },
)

RadialProgress.displayName = "RadialProgress"

export { RadialProgress, radialProgressVariants }
