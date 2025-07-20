import { cn } from "@/lib/utils"
import { Navbar } from "@/components/navbar";

// Layout for the different sections: profile, workouts, history, etc
const MainLayout = ({ children }) => {
    return (
        <>
            <div className={cn(
                "mx-auto h-auto w-auto",
                "xs:max-w-md p-4 lg:max-w-lg"
            )}>
                <div className="space-y-4 w-full h-full">
                    {children}
                </div>
            </div>
            <Navbar />
        </>
    );
}

export { MainLayout }