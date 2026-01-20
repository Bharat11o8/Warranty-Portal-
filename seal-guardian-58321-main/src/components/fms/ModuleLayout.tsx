import { ReactNode } from "react";
import { Search, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NotificationPopover } from "./NotificationPopover";

interface ModuleLayoutProps {
    title: string;
    description?: string;
    children: ReactNode;
    actions?: ReactNode;
}

export const ModuleLayout = ({ title, description, children, actions }: ModuleLayoutProps) => {
    return (
        <div className="flex flex-col h-full">
            {/* Module Header */}
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b px-8 py-4 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
                    {description && <p className="text-sm text-muted-foreground mt-0.5 font-medium">{description}</p>}
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Universal search..."
                            className="pl-9 w-64 bg-muted/50 border-0 focus-visible:ring-primary/20 rounded-full h-9"
                        />
                    </div>

                    <div className="flex items-center gap-1 border-l pl-4 ml-2">
                        <NotificationPopover />
                        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-muted-foreground hover:text-primary">
                            <HelpCircle className="h-4 w-4" />
                        </Button>
                    </div>

                    {actions && (
                        <div className="border-l pl-4 hidden sm:block">
                            {actions}
                        </div>
                    )}
                </div>
            </header>

            {/* Module Content */}
            <main className="flex-1 overflow-y-auto p-8 bg-muted/10">
                <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
};
