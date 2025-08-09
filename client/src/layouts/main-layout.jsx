"use client"

import { cn } from "@/lib/utils"
import { Navbar } from "@/components/navbar";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocation } from "react-router-dom";

// Layout for the app sections: profile, workouts, history, etc
const MainLayout = ({ children }) => {
    const isMobile = useIsMobile();
    const location = useLocation();

    // Gets the current URL path
    const pathnames = location.pathname.split("/").filter(Boolean);

    return (
        // Hides the sidebar for sm devices
        <SidebarProvider>
            {!isMobile && (
                <AppSidebar />
            )}
            <SidebarInset>
                {!isMobile && (
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b">
                        <div className="flex items-center gap-2 px-3">
                            <SidebarTrigger />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <Breadcrumb>
                                <BreadcrumbList>
                                    {pathnames.map((segment, index) => {
                                        const to = "/" + pathnames.slice(0, index + 1).join("/");
                                        const isLast = index === pathnames.length - 1;

                                        return (
                                            <BreadcrumbItem key={to}>
                                                <BreadcrumbSeparator />
                                                {isLast ? (
                                                    <span className="capitalize font-semibold">{segment}</span>
                                                ) : (
                                                    <BreadcrumbLink asChild>
                                                        <Link to={to} className="capitalize">{segment}</Link>
                                                    </BreadcrumbLink>
                                                )}
                                            </BreadcrumbItem>
                                        );
                                    })}
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>
                )}
                {/* Where children props go */}
                <div className={cn(
                    "mx-auto h-auto w-auto",
                    "xs:max-w-md p-4 lg:max-w-lg"
                )}>
                    <div className="space-y-4 w-full h-full">
                        {children}
                        <Navbar />
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

export { MainLayout }