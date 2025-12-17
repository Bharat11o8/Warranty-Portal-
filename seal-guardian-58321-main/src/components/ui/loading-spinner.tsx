import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    text?: string;
    className?: string;
    fullScreen?: boolean;
}

const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
};

export function LoadingSpinner({
    size = "md",
    text,
    className,
    fullScreen = false
}: LoadingSpinnerProps) {
    const content = (
        <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
            <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
            {text && <p className="text-sm text-muted-foreground animate-pulse">{text}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                {content}
            </div>
        );
    }

    return content;
}

export function LoadingOverlay({ text = "Loading..." }: { text?: string }) {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg z-10">
            <LoadingSpinner size="lg" text={text} />
        </div>
    );
}

export function PageLoader({ text = "Loading..." }: { text?: string }) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <LoadingSpinner size="lg" text={text} />
        </div>
    );
}
