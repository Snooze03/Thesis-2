import { cn } from "@/lib/utils"

export const InputError = ({ className, children, props }) => {
    return (
        <div
            className={cn(
                "px-1 text-sm text-red-500",
                className
            )}
            {...props}>

            {children}
        </div>
    );
}