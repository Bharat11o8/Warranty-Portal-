import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";

/**
 * PublicLayout - A minimal layout for public/unauthenticated pages
 * Used for QR-based warranty registration flow
 * Features: Header with logo only, no sidebar, clean focused design
 */
const PublicLayout = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50/30 to-white">
            {/* Minimal Header - Logo Only */}
            <header className="sticky top-0 z-50 w-full border-b border-orange-100 bg-white/80 backdrop-blur-lg">
                <nav className="container mx-auto flex h-16 items-center justify-center px-4">
                    <Link to="/" className="flex items-center">
                        <img
                            src="/autoform-logo.png"
                            alt="Autoform"
                            className="h-10 md:h-12 w-auto object-contain"
                        />
                    </Link>
                </nav>
            </header>

            {/* Main Content - Full Width, Centered */}
            <main className="container mx-auto px-4 py-8">
                <Outlet />
            </main>

            {/* Simple Footer */}
            <footer className="border-t border-orange-100 bg-white py-6 mt-8">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-xs text-slate-400">
                        © {new Date().getFullYear()} Autoform India. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
