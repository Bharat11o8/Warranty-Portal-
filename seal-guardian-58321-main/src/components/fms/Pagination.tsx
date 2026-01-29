import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    rowsPerPage?: number;
    onRowsPerPageChange?: (rows: number) => void;
    className?: string;
}

export const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    rowsPerPage,
    onRowsPerPageChange,
    className
}: PaginationProps) => {
    // If we have totalPages, we show the controls.
    // We don't hide if totalPages <= 1 because "Rows per page" might still be useful.

    const renderPageLinks = () => {
        const pages = [];
        const maxVisible = 5;

        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        if (start > 1) {
            pages.push(
                <Button
                    key={1}
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(1)}
                    className="h-8 w-8 rounded-full border-orange-100 text-slate-900 font-bold hover:bg-orange-50 hover:text-orange-600 transition-all text-xs"
                >
                    1
                </Button>
            );
            if (start > 2) {
                pages.push(
                    <div key="start-ellipsis" className="flex items-center justify-center w-8 text-slate-400">
                        <MoreHorizontal className="h-3 w-3" />
                    </div>
                );
            }
        }

        for (let i = start; i <= end; i++) {
            pages.push(
                <Button
                    key={i}
                    variant={currentPage === i ? "default" : "outline"}
                    size="icon"
                    onClick={() => onPageChange(i)}
                    className={cn(
                        "h-8 w-8 rounded-full font-bold transition-all text-xs",
                        currentPage === i
                            ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700 pointer-events-none"
                            : "border-orange-100 text-slate-900 hover:bg-orange-50 hover:text-orange-600"
                    )}
                >
                    {i}
                </Button>
            );
        }

        if (end < totalPages) {
            if (end < totalPages - 1) {
                pages.push(
                    <div key="end-ellipsis" className="flex items-center justify-center w-8 text-slate-400">
                        <MoreHorizontal className="h-3 w-3" />
                    </div>
                );
            }
            pages.push(
                <Button
                    key={totalPages}
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(totalPages)}
                    className="h-8 w-8 rounded-full border-orange-100 text-slate-900 font-bold hover:bg-orange-50 hover:text-orange-600 transition-all text-xs"
                >
                    {totalPages}
                </Button>
            );
        }

        return pages;
    };

    return (
        <div className={cn("flex flex-wrap items-center justify-end gap-2 md:gap-5 py-4 md:py-6 px-1", className)}>
            {/* Rows Per Page Selection */}
            {onRowsPerPageChange && rowsPerPage !== undefined && (
                <div className="flex items-center gap-1.5 md:gap-3">
                    <span className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                        <span className="hidden sm:inline">Rows Per Page:</span>
                        <span className="sm:hidden">Rows:</span>
                    </span>
                    <Select
                        value={rowsPerPage.toString()}
                        onValueChange={(val) => onRowsPerPageChange(parseInt(val))}
                    >
                        <SelectTrigger hideIndicator className="w-[45px] h-8 rounded-full border-orange-100 bg-white text-slate-700 font-bold text-xs focus:ring-4 focus:ring-orange-500/10 px-0 flex items-center justify-center">
                            <SelectValue placeholder={rowsPerPage.toString()} />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-orange-100 shadow-xl min-w-[60px]">
                            {[10, 20, 30, 50, 100].map((num) => (
                                <SelectItem key={num} value={num.toString()} hideIndicator className="font-bold text-xs text-slate-600 rounded-lg py-2">
                                    {num}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 0 && (
                <div className="flex items-center gap-1.5">
                    <Button
                        variant="outline"
                        size="icon"
                        disabled={currentPage === 1}
                        onClick={() => onPageChange(currentPage - 1)}
                        className="h-7 w-7 md:h-8 md:w-8 rounded-full border-orange-100 text-slate-900 disabled:opacity-20 hover:bg-orange-50 hover:text-orange-600 transition-all font-bold"
                    >
                        <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Button>

                    <div className="flex items-center gap-1 md:gap-1.5">
                        {renderPageLinks().map((link: any) => React.cloneElement(link, {
                            className: cn(link.props.className, "h-7 w-7 md:h-8 md:w-8 rounded-full text-[10px] md:text-xs")
                        }))}
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        disabled={currentPage === totalPages}
                        onClick={() => onPageChange(currentPage + 1)}
                        className="h-7 w-7 md:h-8 md:w-8 rounded-full border-orange-100 text-slate-900 disabled:opacity-20 hover:bg-orange-50 hover:text-orange-600 transition-all font-bold"
                    >
                        <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
};
