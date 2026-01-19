import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquareWarning, LogOut, Home } from "lucide-react";

const CustomerLayout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    // If not a customer, just render the standard header layout
    if (!user || user.role !== 'customer') {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container mx-auto px-4 py-8">
                    <Outlet />
                </main>
            </div>
        );
    }

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar - Always visible on md+ for customers */}
            <aside className="hidden md:flex md:w-64 lg:w-72 flex-col fixed inset-y-0 left-0 z-50 bg-card border-r border-border">
                {/* Logo */}
                {/* Logo */}
                <div className="flex items-center justify-center px-6 py-3 border-b border-border">
                    <Link to="/" className="flex items-center gap-3">
                        <img
                            src="/autoform-logo.png"
                            alt="Autoform"
                            className="h-10 w-auto"
                        />
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    <Link to="/dashboard/customer">
                        <Button
                            variant="ghost"
                            className={`w-full justify-start gap-3 h-11 ${isActive('/dashboard/customer') ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
                        >
                            <Home className="h-5 w-5" />
                            Home
                        </Button>
                    </Link>
                    <Link to="/grievance">
                        <Button
                            variant="ghost"
                            className={`w-full justify-start gap-3 h-11 ${isActive('/grievance') ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
                        >
                            <MessageSquareWarning className="h-5 w-5" />
                            Grievance
                        </Button>
                    </Link>
                    <Link to="/terms">
                        <Button
                            variant="ghost"
                            className={`w-full justify-start gap-3 h-11 ${isActive('/terms') ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
                        >
                            <FileText className="h-5 w-5" />
                            Terms & Conditions
                        </Button>
                    </Link>
                </nav>

                {/* Footer Section: Profile & Logout */}
                <div className="p-4 border-t border-border space-y-4">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                        onClick={logout}
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Mobile Header (Visible on small screens) */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
                <Header />
            </div>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 lg:ml-72 pt-16 md:pt-0 overflow-x-hidden w-full">
                {/* 
                   We remove container here because pages might want full width (like GrievancePage with its own background),
                   but we need to ensure content doesn't get hidden behind fixed headers if pages don't handle padding.
                   However, GrievancePage has its own container styling.
                   CustomerDashboard has its own container styling.
                   Terms has its own.
                   So we just provide the scrollable area.
                */}
                <Outlet />
            </main>
        </div>
    );
};

export default CustomerLayout;
