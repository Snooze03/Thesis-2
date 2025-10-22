import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DailyEntryCard } from "./daily-entry-card";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useDailyEntriesHistory } from "@/hooks/nutrition/useDailyEntry";

export function DailyEntriesHistory() {
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 1; // Show 1 entry per page

    const {
        entries,
        pagination,
        error,
        isFetching,
    } = useDailyEntriesHistory(
        currentPage,
        pageSize
    );

    // console.log("Pagination data:", pagination);
    // console.log("Entries length:", entries.length);
    // console.log("Current page:", currentPage);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Generate page numbers to show
    const generatePageNumbers = () => {
        const { totalPages } = pagination;
        const maxVisiblePages = 1;
        const pages = [];

        if (totalPages <= maxVisiblePages) {
            // Show all pages if total pages is less than or equal to maxVisiblePages
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show ellipsis logic
            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(totalPages, currentPage + 2);

            if (startPage > 1) {
                pages.push(1);
                if (startPage > 2) pages.push('ellipsis-start');
            }

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) pages.push('ellipsis-end');
                pages.push(totalPages);
            }
        }

        return pages;
    };

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

                    <div className="space-y-4">
                        {entries.map((dailyEntry) => (
                            <DailyEntryCard
                                key={dailyEntry.id}
                                dailyEntry={dailyEntry}
                            />
                        ))}
                    </div>

                    {pagination.totalPages > 1 && (
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        className={
                                            !pagination.previous || isFetching
                                                ? "pointer-events-none opacity-50"
                                                : "cursor-pointer"
                                        }
                                    />
                                </PaginationItem>

                                {generatePageNumbers().map((page, index) => (
                                    <PaginationItem key={index}>
                                        {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                                            <PaginationEllipsis />
                                        ) : (
                                            <PaginationLink
                                                onClick={() => handlePageChange(page)}
                                                isActive={currentPage === page}
                                                className="cursor-pointer"
                                            >
                                                {page}
                                            </PaginationLink>
                                        )}
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        className={
                                            !pagination.next || isFetching
                                                ? "pointer-events-none opacity-50"
                                                : "cursor-pointer"
                                        }
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}

                </>
            )}
        </>
    );
}
