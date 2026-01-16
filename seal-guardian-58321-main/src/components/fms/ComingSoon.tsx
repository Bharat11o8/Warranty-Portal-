import { PackageSearch, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComingSoonProps {
    title: string;
}

export const ComingSoon = ({ title }: ComingSoonProps) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-card rounded-2xl border border-dashed shadow-inner">
            <div className="h-24 w-24 bg-primary/5 rounded-full flex items-center justify-center mb-6 relative">
                <PackageSearch className="h-10 w-10 text-primary/40" />
                <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-25" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight mb-2">{title} Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
                We are crafting a world-class experience for {title.toLowerCase()}. This module will be part of our next major update to streamline your operations.
            </p>
            <div className="flex gap-4">
                <Button variant="outline" className="rounded-full px-6">
                    Notify Me
                </Button>
                <Button className="rounded-full px-6 group">
                    Go to Dashboard <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
            </div>
        </div>
    );
};
