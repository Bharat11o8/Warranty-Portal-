import { useEffect, useState } from "react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    LayoutDashboard,
    Store,
    Users,
    ShieldCheck,
    Settings,
    UserCog,
    FileText,
    Search,
    MessageSquare,
    Package,
    PenTool,
    Megaphone,
    Hash
} from "lucide-react";
import { AdminModule } from "./layout/AdminSidebar";

interface AdminCommandPaletteProps {
    onNavigate: (module: AdminModule) => void;
}

export const AdminCommandPalette = ({ onNavigate }: AdminCommandPaletteProps) => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <>
            <div
                className="hidden md:flex items-center text-sm text-muted-foreground bg-white border border-orange-100 rounded-md px-3 py-1.5 cursor-pointer hover:bg-orange-50/50 hover:border-orange-200 transition-colors shadow-sm gap-2"
                onClick={() => setOpen(true)}
            >
                <Search className="h-3.5 w-3.5" />
                <span className="mr-4">Search...</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">ctrl</span>+ K
                </kbd>
            </div>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Navigation">
                        <CommandItem onSelect={() => runCommand(() => onNavigate('overview'))}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard Overview</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => onNavigate('warranties'))}>
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            <span>Warranties</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => onNavigate('vendors'))}>
                            <Store className="mr-2 h-4 w-4" />
                            <span>Franchises</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => onNavigate('customers'))}>
                            <Users className="mr-2 h-4 w-4" />
                            <span>Customers</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => onNavigate('admins'))}>
                            <UserCog className="mr-2 h-4 w-4" />
                            <span>Admin Users</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => onNavigate('activity-logs'))}>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Activity Logs</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => onNavigate('grievances'))}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <span>Grievances</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => onNavigate('products'))}>
                            <Package className="mr-2 h-4 w-4" />
                            <span>Product Catalog</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => onNavigate('warranty-form'))}>
                            <PenTool className="mr-2 h-4 w-4" />
                            <span>New Registration</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => onNavigate('uid-management'))}>
                            <Hash className="mr-2 h-4 w-4" />
                            <span>UID Management</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => onNavigate('terms'))}>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Terms & Conditions</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => onNavigate('announcements'))}>
                            <Megaphone className="mr-2 h-4 w-4" />
                            <span>Broadcast / Announcements</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Settings">
                        <CommandItem onSelect={() => runCommand(() => onNavigate('profile'))}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
};
