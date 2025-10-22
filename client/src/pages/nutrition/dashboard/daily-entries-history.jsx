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

    // Generate page numbers to show - fixed logic
    const generatePageNumbers = () => {
        const { totalPages } = pagination;
        const maxVisiblePages = 3; // Show maximum 3 page numbers
        const pages = [];

        if (totalPages <= maxVisiblePages + 2) {
            // If total pages is small, show all
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show current page and 1 page on each side
            const startPage = Math.max(1, currentPage - 1);
            const endPage = Math.min(totalPages, currentPage + 1);

            // Always show first page if not in range
            if (startPage > 1) {
                pages.push(1);
                if (startPage > 2) {
                    pages.push('ellipsis-start');
                }
            }

            // Add the range around current page
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            // Always show last page if not in range
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    pages.push('ellipsis-end');
                }
                pages.push(totalPages);
            }
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
                        <div className="w-max">
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