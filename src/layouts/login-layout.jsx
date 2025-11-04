import { cn } from "@/lib/utils";
// Layout for the initial login and signup forms
const LoginLayout = ({ children }) => {
    return (
        <div className={cn(
            "flex min-h-svh w-full items-center justify-center p-6",
            "max-2xs:p-3 max-xs:p-4  md:p-10"
        )}>
            <div className="w-full max-w-sm">
                <h1 className={cn(
                    "text-center text-4xl mb-5 text-primary font-semibold",
                    "max-2xs:text-3xl max-2xs:mb-3"
                )}>PrimeDFit</h1>
                {children}
            </div>
        </div>
    );
}

export { LoginLayout }