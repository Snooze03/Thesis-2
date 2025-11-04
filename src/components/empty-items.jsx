// File: components/ui/empty-state.jsx

import * as React from "react"
import { cn } from "@/lib/utils" // Assumes you have a cn utility function

const EmptyItems = React.forwardRef(({
    className,
    title = "No items added yet", // Default title
    description,
    ...props
}, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "flex flex-col items-center justify-center text-center p-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg",
                className
            )}
            {...props}
        >
            <h3 className="text-md font-semibold text-gray-600">{title}</h3>
            {description && <p className="text-sm mt-1">{description}</p>}
        </div>
    )
})

EmptyItems.displayName = "EmptyState"

export { EmptyItems }