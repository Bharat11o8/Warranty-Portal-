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
import { Settings, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_MENU_GROUPS, canSeeAdminModule, type AdminModule } from "./layout/adminModules";

/*
 * cmdk's default scoring matches letters in order anywhere, so "ppf" also
 * offered Manpower, POSM and Sourcing Map. Here every typed word has to appear
 * in the label or its keywords; labels that start with the first word rank
 * above ones that merely contain it.
 */
const wordFilter = (value: string, search: string, keywords?: string[]): number => {
    const words = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return 1;
    const label = value.toLowerCase();
    const haystack = [label, ...(keywords || []).map(k => k.toLowerCase())].join(' ');
    if (!words.every(w => haystack.includes(w))) return 0;
    if (label.startsWith(words[0])) return 1;
    return label.includes(words[0]) ? 0.8 : 0.5;
};

interface AdminCommandPaletteProps {
    onNavigate: (module: AdminModule) => void;
}

export const AdminCommandPalette = ({ onNavigate }: AdminCommandPaletteProps) => {
    const [open, setOpen] = useState(false);
    const { user, hasPermission } = useAuth();

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

    // Same modules, grouping and permission filter as the sidebar.
    const groups = ADMIN_MENU_GROUPS
        .map(group => ({
            ...group,
            items: group.items.filter(item => canSeeAdminModule(item.id, user, hasPermission))
        }))
        .filter(group => group.items.length > 0);

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

            <CommandDialog open={open} onOpenChange={setOpen} commandProps={{ filter: wordFilter }}>
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    {groups.map(group => (
                        <CommandGroup key={group.label} heading={group.label}>
                            {group.items.map(({ id, label, icon: Icon, keywords }) => (
                                <CommandItem
                                    key={id}
                                    value={label}
                                    keywords={[group.label, ...(keywords || [])]}
                                    onSelect={() => runCommand(() => onNavigate(id))}
                                >
                                    <Icon className="mr-2 h-4 w-4" />
                                    <span>{label}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    ))}
                    <CommandSeparator />
                    <CommandGroup heading="Settings">
                        <CommandItem
                            value="Profile"
                            keywords={['account', 'my profile']}
                            onSelect={() => runCommand(() => onNavigate('profile'))}
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
};
