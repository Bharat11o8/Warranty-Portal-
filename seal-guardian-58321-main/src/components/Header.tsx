import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import ProfilePopover from "./ProfilePopover";
import { Users, ClipboardList, Package, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <Link to="/" onClick={() => mobile && setIsOpen(false)}>
        <Button
          variant={isActive("/") ? "secondary" : "ghost"}
          size="sm"
          className={`w-full justify-start ${isActive("/") ? "bg-secondary/50 font-semibold" : ""}`}
        >
          Home Page
        </Button>
      </Link>

      {user ? (
        <>
          {user.role !== 'vendor' && (
            <Link to="/warranty" onClick={() => mobile && setIsOpen(false)}>
              <Button
                variant={isActive("/warranty") ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start"
              >
                Warranty
              </Button>
            </Link>
          )}
          <Link to="/terms" onClick={() => mobile && setIsOpen(false)}>
            <Button
              variant={isActive("/terms") ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
            >
              T&C
            </Button>
          </Link>

          {/* Admin-only links */}
          {user.role === 'admin' && (
            <>
              <Link to="/admin/manage" onClick={() => mobile && setIsOpen(false)}>
                <Button
                  variant={isActive("/admin/manage") ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Admin Management
                </Button>
              </Link>
              <Link to="/admin/products" onClick={() => mobile && setIsOpen(false)}>
                <Button
                  variant={isActive("/admin/products") ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Products
                </Button>
              </Link>
              <Link to="/admin/activity-logs" onClick={() => mobile && setIsOpen(false)}>
                <Button
                  variant={isActive("/admin/activity-logs") ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start flex items-center gap-2"
                >
                  <ClipboardList className="h-4 w-4" />
                  Activity Logs
                </Button>
              </Link>
            </>
          )}
        </>
      ) : (
        <>
          <Link to="/terms" onClick={() => mobile && setIsOpen(false)}>
            <Button
              variant={isActive("/terms") ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
            >
              T&C
            </Button>
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-lg">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2">
          <img
            src="/autoform-logo.png"
            alt="Autoform"
            className="h-10 w-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/">
            <Button
              variant={isActive("/") ? "secondary" : "ghost"}
              size="sm"
              className={isActive("/") ? "bg-secondary/50 font-semibold" : ""}
            >
              Home Page
            </Button>
          </Link>

          {user ? (
            <>
              {user.role !== 'vendor' && (
                <Link to="/warranty">
                  <Button variant={isActive("/warranty") ? "secondary" : "ghost"} size="sm">
                    Warranty
                  </Button>
                </Link>
              )}
              <Link to="/terms">
                <Button variant={isActive("/terms") ? "secondary" : "ghost"} size="sm">
                  T&C
                </Button>
              </Link>

              {user.role === 'admin' && (
                <>
                  <Link to="/admin/manage">
                    <Button
                      variant={isActive("/admin/manage") ? "secondary" : "ghost"}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Users className="h-4 w-4" />
                      Admin Management
                    </Button>
                  </Link>
                  <Link to="/admin/products">
                    <Button
                      variant={isActive("/admin/products") ? "secondary" : "ghost"}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Package className="h-4 w-4" />
                      Products
                    </Button>
                  </Link>
                  <Link to="/admin/activity-logs">
                    <Button
                      variant={isActive("/admin/activity-logs") ? "secondary" : "ghost"}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <ClipboardList className="h-4 w-4" />
                      Activity Logs
                    </Button>
                  </Link>
                </>
              )}

              <ProfilePopover />
            </>
          ) : (
            <Link to="/terms">
              <Button variant={isActive("/terms") ? "secondary" : "ghost"} size="sm">
                T&C
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2">
          {user && <ProfilePopover />}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col gap-4 mt-8">
                <NavItems mobile />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};

export default Header;
