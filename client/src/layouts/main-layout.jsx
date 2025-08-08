"use client"

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils"
import { Navbar } from "@/components/navbar";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useIsMobile } from "@/hooks/use-mobile"

// Layout for the app sections: profile, workouts, history, etc
const MainLayout = ({ children }) => {
    const isMobile = useIsMobile();

    return (
        <>
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
                                        <BreadcrumbItem className="hidden md:block">
                                            <BreadcrumbLink href="#">
                                                Building Your Application
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator className="hidden md:block" />
                                        <BreadcrumbItem>
                                            <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </BreadcrumbList>
                                </Breadcrumb>
                            </div>
                        </header>
                    )}
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

        </>
    );
}

export { MainLayout }