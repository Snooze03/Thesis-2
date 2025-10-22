import { useState, useEffect } from "react";
import { useDailyEntriesHistory } from "@/hooks/nutrition/useDailyEntry";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { DailyEntryCard } from "./daily-entry-card";

export function DailyEntriesHistory() {
    const [currentPage, setCurrentPage] = useState(null);
    const pageSize = 1; // Show 1 entry per page

    const {
        entries,
        pagination,
        error,
        isFetching,
        isLoading,
    } = useDailyEntriesHistory(
        currentPage || 1,
        pageSize
    );

    // Set initial page to the last page (latest entry) when pagination loads
    useEffect(() => {
        if (pagination.totalPages > 0 && currentPage === null) {
            setCurrentPage(pagination.totalPages); // Start at highest page number (newest entry)
        }
    }, [pagination.totalPages, currentPage]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Generate page numbers to show 
    const generatePageNumbers = () => {
        const { totalPages } = pagination;
        const maxVisiblePages = 4; // number of consecutive pages to show
        const pages = [];

        // If total pages is small enough, show all pages
        if (totalPages <= maxVisiblePages + 2) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
            return pages;
        }

        // Calculate the range of pages to show around current page
        const half = Math.floor(maxVisiblePages / 2);
        let startPage = Math.max(1, currentPage - half);
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        // Adjust if we're near the end
        if (endPage === totalPages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Add the visible page range
        for (let i = startPage; i <= endPage; i++) {
            // Avoid duplicating page 1 if it's already added
            if (i === 1 && pages.includes(1)) continue;
            pages.push(i);
        }

        return pages;
    };

    // Loading state while determining initial page
    if (isLoading || currentPage === null) {
        return (
            <>
                <Skeleton className="h-70 w-full mb-4" />
            </>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-red-500">
                    Error loading daily entries: {error.message}
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            {entries.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        No daily entries found.
                    </CardContent>
                </Card>
            ) : (
                <>
                    {entries.map((dailyEntry) => (
                        <DailyEntryCard
                            key={dailyEntry.id}
                            dailyEntry={dailyEntry}
                        />
                    ))}

                    {pagination.totalPages > 1 && (
                        <div className="w-full max-w-full overflow-hidden">
                            <Pagination className="w-full">
                                <PaginationContent className="flex-nowrap justify-center overflow-x-auto px-2">
                                    <PaginationItem className="shrink-0">
                                        <PaginationPrevious
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            className={`text-sm px-2 ${currentPage <= 1 || isFetching
                                                ? "pointer-events-none opacity-50"
                                                : "cursor-pointer"
                                                }`}
                                        />
                                    </PaginationItem>

                                    {generatePageNumbers().map((page, index) => (
                                        <PaginationItem key={index} className="shrink-0">
                                            {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                                                <PaginationEllipsis className="text-sm px-1" />
                                            ) : (
                                                <PaginationLink
                                                    onClick={() => handlePageChange(page)}
                                                    isActive={currentPage === page}
                                                    className="cursor-pointer text-sm px-2 py-1 min-w-[32px]"
                                                >
                                                    {page}
                                                </PaginationLink>
                                            )}
                                        </PaginationItem>
                                    ))}

                                    <PaginationItem className="shrink-0">
                                        <PaginationNext
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            className={`text-sm px-2 ${currentPage >= pagination.totalPages || isFetching
                                                ? "pointer-events-none opacity-50"
                                                : "cursor-pointer"
                                                }`}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </>
            )}
        </>
    );
}