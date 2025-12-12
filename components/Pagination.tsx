'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    isPaginating?: boolean;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (itemsPerPage: number) => void;
}

export function Pagination({
    currentPage,
    totalItems,
    itemsPerPage,
    isPaginating = false,
    onPageChange,
    onItemsPerPageChange,
}: PaginationProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    // Generate page numbers to display
    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        // Always include first page
        range.push(1);

        // Include pages around current page
        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i);
        }

        // Always include last page if more than 1 page
        if (totalPages > 1) {
            range.push(totalPages);
        }

        // Add dots where needed
        let l, i = 0;
        for (i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        }

        return rangeWithDots;
    };

    if (totalItems === 0) {
        return null;
    }

    const visiblePages = getVisiblePages();

    return (
        <div className="flex items-center justify-between px-2 py-4">
            <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Show</span>
                <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
                >
                    <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='border-0'>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">Entries</span>
            </div>

            <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground md:block hidden">
                    {!isPaginating ? `Showing ${startItem} to ${endItem} of ${totalItems} entries` : 'Refreshing…'}
                </span>

                <div className="flex items-center space-x-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevious}
                        // disabled={currentPage <= 1}
                        className={`h-8 w-8 p-0 ${currentPage <= 1 ? "cursor-not-allowed" : ""}`}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {visiblePages.map((page, index) => (
                        page === '...' ? (
                            <span key={`dots-${index}`} className="px-2 text-sm text-muted-foreground">
                                ...
                            </span>
                        ) : (
                            <Button
                                key={page}
                                variant={currentPage === page ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => onPageChange(page as number)}
                                className="h-8 w-8 p-0"
                            >
                                {page}
                            </Button>
                        )
                    ))}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNext}
                        // disabled={currentPage >= totalPages}
                        className={`h-8 w-8 p-0 ${currentPage >= totalPages ? "cursor-not-allowed" : ""}`}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
