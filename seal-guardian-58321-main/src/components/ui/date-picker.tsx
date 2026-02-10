"use client";

import * as React from "react";
import { format, parse } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
    value?: string; // ISO date string YYYY-MM-DD
    onChange: (value: string) => void;
    maxDate?: Date;
    minDate?: Date;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function DatePicker({
    value,
    onChange,
    maxDate,
    minDate,
    placeholder = "Select date",
    disabled = false,
    className,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);

    // Parse the ISO string value to Date object
    const selectedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;

    const handleSelect = (date: Date | undefined) => {
        if (date) {
            // Convert to ISO format YYYY-MM-DD
            const isoDate = format(date, "yyyy-MM-dd");
            onChange(isoDate);
            setOpen(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal bg-white border-slate-200",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                    {selectedDate ? format(selectedDate, "dd MMM yyyy") : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleSelect}
                    disabled={(date) => {
                        if (maxDate && date > maxDate) return true;
                        if (minDate && date < minDate) return true;
                        return false;
                    }}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}

export default DatePicker;
