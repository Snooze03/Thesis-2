import { cn } from "@/lib/utils"

export const InputError = ({ className, children, props }) => {
    return (
        <div
            className={cn(
                "px-3 py-2 text-sm bg-red-50 text-red-500 rounded-lg",
                className
            )}
            {...props}>

            {children}
        </div>
    );
}