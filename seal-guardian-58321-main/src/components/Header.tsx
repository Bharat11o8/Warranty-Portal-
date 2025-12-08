import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import ProfilePopover from "./ProfilePopover";
import { Users, ClipboardList } from "lucide-react";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-lg">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2">
          {/* Logo can be added here if needed */}
        </Link>

        <div className="flex items-center gap-4">
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
              <Link to="/warranty">
                <Button variant={isActive("/warranty") ? "secondary" : "ghost"} size="sm">
                  Warranty
                </Button>
              </Link>
              <Link to="/terms">
                <Button variant={isActive("/terms") ? "secondary" : "ghost"} size="sm">
                  T&C
                </Button>
              </Link>

              {/* Admin-only links */}
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
            <>
              <Link to="/terms">
                <Button variant={isActive("/terms") ? "secondary" : "ghost"} size="sm">
                  T&C
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
