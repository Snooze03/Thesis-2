import { useState, useEffect, useMemo, useCallback } from "react";
import { useDailyEntriesHistory } from "@/hooks/nutrition/useDailyEntry";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { DailyEntryCard } from "./daily-entry-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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

    // Memoize page change handler
    const handlePageChange = useCallback((page) => {
        if (page >= 1 && page <= pagination.totalPages && !isFetching) {
            setCurrentPage(page);
        }
    }, [pagination.totalPages, isFetching]);

    // Memoize page numbers generation
    const pageNumbers = useMemo(() => {
        const { totalPages } = pagination;
        const maxVisiblePages = 4;
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
            pages.push(i);
        }

        return pages;
    }, [pagination.totalPages, currentPage]);

    if (error) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-red-500">
                    Error loading daily entries: {error.message}
                </CardContent>
            </Card>
        );
    }

    if (isLoading || currentPage === null) {
        return (
            <Card className="min-h-90">
                <CardContent className="my-auto text-center text-muted-foreground">
                    <LoadingSpinner message="entry" />
                </CardContent>
            </Card>
        );
    }

    if (entries.length === 0) {
        return (
            <Card className="min-h-90">
                <CardContent className="py-8 text-center text-muted-foreground">
                    No daily entries found
                </CardContent>
            </Card>
        );
    }

    return (
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
                                    className={`text-sm px-2 ${!pagination.hasPrevious || isFetching
                                        ? "pointer-events-none opacity-50"
                                        : "cursor-pointer"
                                        }`}
                                />
                            </PaginationItem>

                            {pageNumbers.map((page) => (
                                <PaginationItem key={page} className="shrink-0">
                                    <PaginationLink
                                        onClick={() => handlePageChange(page)}
                                        isActive={currentPage === page}
                                        className={`cursor-pointer text-sm px-2 py-1 min-w-[32px] ${isFetching ? "pointer-events-none" : ""
                                            }`}
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}

                            <PaginationItem className="shrink-0">
                                <PaginationNext
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    className={`text-sm px-2 ${!pagination.hasNext || isFetching
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
    );
}