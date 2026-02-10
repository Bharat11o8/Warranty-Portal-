"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Option {
    value: string;
    label: string;
}

interface MobileSelectProps {
    options: Option[];
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    title?: string;
    disabled?: boolean;
    className?: string;
}

// Simple hook to detect mobile
function useIsMobile() {
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    return isMobile;
}

export function MobileSelect({
    options,
    value,
    onValueChange,
    placeholder = "Select...",
    title = "Select an option",
    disabled = false,
    className,
}: MobileSelectProps) {
    const isMobile = useIsMobile();
    const [open, setOpen] = React.useState(false);

    const selectedLabel = options.find((opt) => opt.value === value)?.label;

    // On mobile, use Drawer (bottom sheet)
    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>
                    <Button
                        variant="outline"
                        disabled={disabled}
                        className={cn(
                            "w-full justify-between font-normal bg-white border-slate-200",
                            !value && "text-muted-foreground",
                            className
                        )}
                    >
                        {selectedLabel || placeholder}
                        <svg
                            className="h-4 w-4 opacity-50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </Button>
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader className="border-b">
                        <DrawerTitle>{title}</DrawerTitle>
                    </DrawerHeader>
                    <div className="max-h-[50vh] overflow-y-auto p-2">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onValueChange(option.value);
                                    setOpen(false);
                                }}
                                className={cn(
                                    "w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-colors",
                                    value === option.value
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "hover:bg-slate-100"
                                )}
                            >
                                <span>{option.label}</span>
                                {value === option.value && <Check className="h-4 w-4" />}
                            </button>
                        ))}
                    </div>
                    <div className="p-4 border-t">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    // On desktop, use regular Select
    return (
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
            <SelectTrigger className={cn("bg-white border-slate-200", className)}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export default MobileSelect;
