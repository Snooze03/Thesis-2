import { cn } from "@/lib/utils"

export const InputError = ({ className, children, props }) => {
    return (
        <div
            className={cn(
                "mt-1 col-span-2 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md",
                className
            )}
            {...props}>

            {children}
        </div>
    );
}