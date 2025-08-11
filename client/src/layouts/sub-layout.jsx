import { cn } from "@/lib/utils";

// Layouts for Sub sections: workouts/create
function SubLayout({ children }) {
    return (
        <div className={cn(
            "mx-auto h-auto w-auto",
            "xs:max-w-md p-4 lg:max-w-lg"
        )}>
            <div className="space-y-4 w-full h-full">
                {children}
            </div>
        </div>
    );
}

export { SubLayout }