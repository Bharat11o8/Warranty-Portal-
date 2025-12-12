import { Link } from "react-router-dom";
import { User, LogOut, Settings, Shield, Store, UserCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth, UserRole } from "@/contexts/AuthContext";

const ProfilePopover = () => {
    const { user, logout } = useAuth();

    if (!user) return null;

    const getRoleConfig = (role: UserRole) => {
        switch (role) {
            case "admin":
                return {
                    icon: Shield,
                    label: "Administrator",
                    badgeVariant: "default" as const,
                    color: "text-accent",
                };
            case "vendor":
                return {
                    icon: Store,
                    label: "Franchise",
                    badgeVariant: "secondary" as const,
                    color: "text-secondary",
                };
            default:
                return {
                    icon: UserCircle,
                    label: "Customer",
                    badgeVariant: "outline" as const,
                    color: "text-primary",
                };
        }
    };

    const roleConfig = getRoleConfig(user.role);
    const RoleIcon = roleConfig.icon;

    const handleLogout = async () => {
        await logout();
        window.location.href = "/";
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <div className={`h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ${roleConfig.color}`}>
                        <RoleIcon className="h-5 w-5" />
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-2">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        <Badge variant={roleConfig.badgeVariant} className="w-fit">
                            <RoleIcon className="mr-1 h-3 w-3" />
                            {roleConfig.label}
                        </Badge>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Edit Profile</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default ProfilePopover;
